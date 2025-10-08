import { MediaItem } from "@media/contracts";
import axios from "axios";

// Simple in-memory token fallback; real app might prefer context/localStorage.
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("accessToken", token);
    else localStorage.removeItem("accessToken");
  }
}
export function loadStoredToken() {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("accessToken");
  authToken = t;
  return t;
}

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function listMedia(): Promise<MediaItem[]> {
  const res = await fetch(`${BASE_URL}/media`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  });
  if (!res.ok) throw new Error("Failed to fetch media");
  return res.json();
}

export interface UploadParams {
  title: string;
  description?: string;
  file: File;
  onProgress?: (pct: number) => void;
}

export async function uploadMedia({
  title,
  description,
  file,
  onProgress,
}: UploadParams): Promise<MediaItem> {
  const form = new FormData();
  form.append("title", title);
  if (description) form.append("description", description);
  form.append("file", file); // field name must match FileInterceptor('file') on backend

  try {
    const response = await axios.post<MediaItem>(`${BASE_URL}/media`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      onUploadProgress: (evt) => {
        if (evt.total) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          onProgress?.(pct);
        }
      },
    });
    return response.data;
  } catch (err: unknown) {
    let message = "Upload failed";
    if (axios.isAxiosError(err)) {
      // attempt to extract a message field if server returned JSON
      const data = err.response?.data as unknown;
      if (data && typeof data === "object" && "message" in data) {
        const possible = (data as { message?: unknown }).message;
        if (typeof possible === "string" && possible.trim()) {
          message = possible;
        }
      }
      message = message || err.message || "Upload failed";
    } else if (err instanceof Error) {
      message = err.message || message;
    }
    throw new Error(message);
  }
}

// ---------- Auth Endpoints ----------
interface AuthResponse {
  accessToken: string;
}

function mapServerError(raw: unknown, fallback: string): string {
  // NestJS default error shape: { statusCode, message, error }
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const msg = obj.message;
    if (Array.isArray(msg) && msg.length) return msg[0];
    if (typeof msg === "string" && msg.trim()) {
      switch (msg) {
        case "Email already registered":
          return "That email is already in use. Try logging in instead.";
        case "Invalid credentials":
          return "Incorrect email or password.";
        default:
          return msg;
      }
    }
    const error = obj.error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return fallback;
}

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function register(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw new Error(
      mapServerError(body ?? (await res.text()), "Registration failed")
    );
  }
  const data = (await res.json()) as AuthResponse;
  setAuthToken(data.accessToken);
  return data;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw new Error(mapServerError(body ?? (await res.text()), "Login failed"));
  }
  const data = (await res.json()) as AuthResponse;
  setAuthToken(data.accessToken);
  return data;
}

export interface MeResponse {
  id: string;
  email: string;
  createdAt: string;
}

export async function me(): Promise<MeResponse> {
  if (!authToken) throw new Error("Not authenticated");
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export function logout() {
  setAuthToken(null);
}

## Architecture (Current Flow)

This document describes the real runtime flow: browser → Next.js frontend → NestJS API → (a) local PostgreSQL for metadata and users, (b) Supabase Storage for binary media (images/videos). The backend stores and returns public (currently unsigned) URLs produced by Supabase.

### 1. High‑Level Diagram

<p align="center">
  <img src="./architecture.png" alt="Architecture Diagram" width="640" />
</p>

### 2. End‑to‑End Request / Data Paths

| Concern       | Flow                                                                                  | Result                                 |
| ------------- | ------------------------------------------------------------------------------------- | -------------------------------------- |
| Auth Register | Browser → Next.js → `POST /auth/register` → NestJS → Postgres                         | User created (hashed pwd) → JWT issued |
| Auth Login    | Browser → Next.js → `POST /auth/login` → NestJS → Postgres                            | Credentials verified → JWT (1h)        |
| Auth Me       | Browser → Next.js → `GET /auth/me` (JWT) → NestJS → Postgres                          | Current user profile JSON              |
| Upload Media  | Browser (multipart) → Next.js → `POST /media` (JWT) → NestJS → Supabase + Postgres    | File stored (Supabase) + metadata row  |
| List Media    | Browser → Next.js → `GET /media` (JWT) → NestJS → Postgres                            | Ordered media list (desc uploadedAt)   |
| Detail Media  | Browser → Next.js → `GET /media/:id` (JWT) → NestJS → Postgres                        | Single media metadata                  |
| Stream Media  | Browser (video element) → Next.js → `GET /media/:id/stream` (JWT) → NestJS → Supabase | Proxied/partial content streaming      |

### 3. Components & Responsibilities

1. Browser (User Agent)
   - Displays UI, sends form/multipart uploads, sets Authorization: Bearer <token>.
2. Next.js Frontend
   - UI layer & auth context; no server-side media processing yet.
   - Could later generate pre-signed upload URLs to bypass API for large files.
3. NestJS API
   - Auth module: register/login/me, JWT issuance & guard enforcement.
   - Media module: validation, size/type enforcement, streaming proxy.
   - Integrations: Prisma (database), Supabase Storage (binary persistence).
4. PostgreSQL (Local Dev Instance)
   - Persists users and media metadata (title, mimeType, size, url, timestamps, reserved thumbnailUrl).
5. Supabase Storage
   - Stores raw file objects; returns a public URL (currently not time‑limited). Future: switch to signed URLs or private bucket + proxy-only access.

### 4. Streaming Strategy

The `/media/:id/stream` endpoint retrieves DB metadata, then performs an HTTP request to the Supabase public file URL. If the client supplies a `Range` header, it is forwarded. Response headers like `Content-Range`, `Accept-Ranges`, and `Content-Type` are proxied back. Errors or timeouts fall back to a 302 redirect to the original public URL. This keeps internal logic simple while allowing future replacement with:

- Private bucket + signed URL retrieval per request (expiring links)
- On-the-fly transcoding (e.g., using ffmpeg workers)
- Adaptive bitrate (HLS/DASH) generation offline

### 5. Environment Variables (Backend)

Required for current flow:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
JWT_SECRET=change-me
SUPABASE_URL=...        # e.g. https://xyzcompany.supabase.co
SUPABASE_SERVICE_KEY=... # Service role key (server side only!)
SUPABASE_BUCKET=media    # Existing bucket name
```

The service role key must never be exposed to the browser. Frontend does not require Supabase keys because it never talks directly to Supabase Storage.

### 6. Security Considerations

- Current design uses public object URLs; anyone with the URL can access the file. Hardening step: switch bucket to private and generate signed URLs (short expiry) or serve strictly via backend proxy.
- Large uploads block the API thread briefly; consider direct upload (signed POST policy) to storage for >50MB.
- JWT: using symmetric secret; rotate regularly and consider refresh tokens if session longevity needed.

### 7. Future Scope

| Area       | Current       | Future                                         |
| ---------- | ------------- | ---------------------------------------------- |
| Metadata   | Basic columns | EXIF extraction, duration, resolution analysis |
| Processing | None          | Third party API (ffmpeg, image resize)         |

<!-- Consolidated duplicate Quick Start & Environment sections below in numbered section 2 & 3 -->
<div align="center">
  <h1>Media Library Monorepo</h1>
  <p><strong>Full‑stack TypeScript monorepo</strong> for uploading, storing, and browsing user media (images & videos) with authentication, metadata, thumbnails, and a modern UI.</p>
</div>

---

## 1. Features At A Glance

| Area           | Highlights                                                             |
| -------------- | ---------------------------------------------------------------------- |
| Auth           | Register, login, JWT (1h expiry), protected media endpoints            |
| Uploads        | Multipart uploads (50MB limit), image & video support, MIME validation |
| Storage        | Supabase Storage (public URLs)                                         |
| Data Access    | Prisma + local PostgreSQL with per‑user scoping                        |
| Frontend       | Next.js (App Router), Tailwind, shadcn/ui components                   |
| Sharing Code   | `@media/contracts` package for typed DTO / entity contracts            |
| Dev Experience | pnpm workspaces + single `pnpm run dev` (concurrently)                 |

---

## 2. Quick Start (Local Dev)

```bash
# 1. Clone
git clone https://github.com/Kritikasingh2004/media-monorepo.git
cd media-monorepo

# 2. Install all workspace dependencies
pnpm install

# 3. Create env files from examples
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 4. Apply database migrations & generate Prisma client
cd apps/backend
pnpm prisma migrate dev --name init
pnpm prisma generate
cd ../../

# 5. Start EVERYTHING (backend + frontend together)
pnpm run dev

# The app is now accessible at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

Login/Register UI is available via the frontend. After login, you can upload and view media items.

---

## 3. Environment Variables

Backend (`apps/backend/.env`):

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
JWT_SECRET=change-me
SUPABASE_URL=...            # e.g. https://your-project.supabase.co
SUPABASE_SERVICE_KEY=...    # service role key (server-only)
SUPABASE_BUCKET=media       # bucket name
```

Frontend (`apps/frontend/.env`):

```
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

> Thumbnails are not currently generated; `thumbnailUrl` stays null.

---

## 4. Scripts (Root & Packages)

Root:

```
pnpm run dev        # concurrently runs backend (3001) + frontend (3000)
pnpm run build      # runs build in all workspaces (recursive)
```

Backend (`apps/backend`):

```
pnpm start:dev      # watch mode (ts-node)
pnpm build          # compile Nest
pnpm start:prod     # run compiled dist
pnpm prisma migrate dev --name <name>
pnpm prisma generate
pnpm test           # unit tests
pnpm test:e2e       # e2e tests
```

Frontend (`apps/frontend`):

```
pnpm dev            # Next.js dev
pnpm build && pnpm start
pnpm lint
```

Target a specific workspace with: `pnpm --filter backend <script>`

---

## 5. API Overview

Authentication (JSON):
| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| POST | `/auth/register` | `{ email, password }` | `{ accessToken }` |
| POST | `/auth/login` | `{ email, password }` | `{ accessToken }` |
| GET | `/auth/me` | (Bearer token) | user profile |

Media (Bearer token required):
| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/media` | Multipart upload (fields: `title`, optional `description`, file: `file`) – 50MB max |
| GET | `/media` | List user media (newest first) |
| GET | `/media/:id` | Get single media metadata |
| GET | `/media/:id/stream` | Stream media file with HTTP Range support (videos & images) |

Media Item shape:

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string?",
  "url": "https://...",
  "type": "image" | "video",
  "mimeType": "image/png",
  "size": 123456,
  "uploadedAt": "2025-10-08T09:15:00.000Z",
  "thumbnailUrl": null
}
```

---

## 6. Data Model (Prisma Extract)

```prisma
model File {
  id           String   @id @default(uuid())
  title        String
  description  String?
  url          String
  type         String
  mimeType     String?
  size         Int?
  thumbnailUrl String?  // reserved (currently unused)
  uploadedAt   DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
  userId       String
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  files     File[]
}
```

---

## 7. Architecture (High Level)

```
Browser (React UI)
   ↓ HTTP (JWT)
Next.js Frontend (proxy / direct calls)
   ↓ REST
NestJS API (Auth + Media modules)
  ├─ Prisma → Local PostgreSQL (users + metadata)
  └─ Supabase Storage (binary files via public URLs)
```

See `docs/architecture.md` for diagram + future scaling notes.

---

## 8. Development Tips

- `pnpm prisma studio` (inside backend) to inspect DB.
- Contract changes in `@media/contracts` require rebuild (restart dev if types not updating).
- Keep large videos below 50MB limit (adjust in `MediaService` if needed).

---

## 9. Testing Strategy

- Backend: Jest unit tests (services), potential e2e (supertest) via `test:e2e`.
- Frontend: (Not yet) Add Playwright / Testing Library for production hardening.

---

## 10. Roadmap (Potential Enhancements)

- Video streaming with range proxy endpoint.
- Background workers (thumbnail generation for videos, transcoding, EXIF extraction).
- Role-based access & shared folders.
- Caching layer (Redis) and CDN in front of eventual object storage.
- Signed URLs / temporary links for private media.

---

## 11. License

UNLICENSED (private). Add an OSS license (e.g., MIT) if publishing.

---

## 12. Maintainer Notes

- Keep secrets out of Git. `.env` files are untracked.
- Run `pnpm outdated` occasionally to keep dependencies fresh.
- Ensure migrations are committed when schema changes.

---

## 14. Acknowledgements

Built with NestJS, Next.js, Prisma, Tailwind, and shadcn/ui.

---

> For deeper architecture & scaling considerations, see `docs/architecture.md`.

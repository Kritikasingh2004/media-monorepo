## Media Platform Project TODO Roadmap

This checklist is tailored to your existing monorepo:

- Backend: NestJS 11 (`apps/backend`)
- Frontend: Next.js 15 (`apps/frontend`)
- Database: PostgreSQL via Prisma (model `File` already exists)
- Current Prisma model stores file metadata but no storage integration yet.

The tasks are organized in phases. Work top‑down. Mark them as you complete.

---

### Legend

- [ ] Not started
- [~] In progress
- [x] Done

You can duplicate this file and mark your progress, or commit changes incrementally.

---

## Phase 0: Environment & Basics

Goal: Be able to run backend + frontend together locally.

- [ ] Install prerequisites: Node.js ≥18, pnpm, Docker (for Postgres) OR local Postgres.
- [ ] Create backend `.env` file:
  - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/media?schema=public"`
  - `GOOGLE_APPLICATION_CREDENTIALS=./path/to/serviceAccountKey.json` # (or set FIREBASE\_\* vars)
  - `FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com`
  - (Later) `MAX_UPLOAD_MB=50`
- [ ] Using Firebase Storage is recommended for this workspace (you already use Firebase). If you prefer S3 later, it can be added as an alternative.
- [ ] Start Postgres (Docker):
  - `docker run --name media-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=media -p 5432:5432 -d postgres:16`
  - Why Docker? Docker provides an isolated, reproducible Postgres instance so you don't need to install Postgres locally. It's optional — if you already have Postgres installed and configured, skip the Docker step.
- [ ] Run `pnpm install` at repo root.
- [ ] Run `pnpm dev` and confirm:
  - Backend compiles (Nest).
  - Frontend dev server starts (Next.js).
  - No Prisma errors (if DB connected).

## Phase 1: Database & Model Refinement

Goal: Ensure schema supports planned features (thumbnails, streaming, metadata).

Current model (`File`) fields:

```
id, title, description?, url, type, mimeType?, size?, uploadedAt
```

Enhance for future features:

- [ ] Decide storage approach: direct upload to backend then backend to cloud OR presigned upload from frontend.
- [ ] Add fields (optional but useful):
  - `storageKey String?` (S3 object key)
  - `thumbnailUrl String?` or `thumbnailKey String?`
  - `durationSeconds Float?` (videos)
  - `width Int?` / `height Int?` (images/videos)
- [ ] Update `schema.prisma` with new fields.
- [ ] Run `pnpm --filter backend prisma migrate dev --name extend_file_model`.
- [ ] Verify migration applied.
- [ ] Generate Prisma client (auto via migrate) and commit migration files.

## Phase 2: Storage Integration (Pick One First)

Choose ONE path to keep scope tight — you can add the other later.

### Option A: Firebase Storage (Recommended — you are already using Firebase)

- [ ] Install deps: `pnpm --filter backend add firebase-admin`
- [ ] Create a Firebase service account JSON and set `GOOGLE_APPLICATION_CREDENTIALS` or initialize with credentials.
- [ ] Implement `src/storage/firebase.service.ts` with methods:
  - `upload(buffer, key, mimeType)` -> uploads to your `FIREBASE_STORAGE_BUCKET` and returns a download URL or a storage path.
  - `getDownloadUrl(key)` or generate signed URLs if bucket is not public.
- [ ] Set appropriate bucket rules; for private objects, serve via signed URLs or backend proxy.

### Option B: AWS S3 (Alternative)

- [ ] If you prefer S3 instead, install `@aws-sdk/client-s3` and follow similar steps to upload/presign.
- [ ] S3 is an alternative; keep Firebase as the default for this project.

## Phase 3: Upload API

Goal: `POST /media` = accept file + metadata, store file remotely, save DB record.

- [ ] Install multipart handling: `pnpm --filter backend add multer` and `pnpm --filter backend add -D @types/multer`.
- [ ] Create DTO: `create-file.dto.ts` (title: string, description?: string).
- [ ] Enable global validation pipe in `main.ts` if not already.
- [ ] Add `MediaModule` (or `FilesModule`): controller + service + provider(s).
- [ ] Controller `POST /media`:
  - Use `@UseInterceptors(FileInterceptor('file'))`.
  - Validate file presence & size.
  - Accept title, description in body.
  - Call service to upload to storage + create Prisma record.
- [ ] Service logic:
  - Generate unique key (e.g., `uuid + originalFilename`).
  - Upload bytes to S3 (or Firebase).
  - Store record with metadata & storage key or public URL.
  - Return normalized response { id, title, type, mimeType, createdAt, url/presigned }.
- [ ] Add size + mimeType capture.
- [ ] Return 201 status.
- [ ] Error handling for unsupported mime types.

## Phase 4: Listing & Detail APIs

- [ ] `GET /media` list (default newest first):
  - Query Prisma for latest 20.
  - Support `?cursor=` or `?page=` (choose one: simplest = page & limit).
  - Return array of items (without huge URLs if you plan presigned per item—optional generate per request).
- [ ] `GET /media/:id` detail.
- [ ] (Optional) In list, include `thumbnailUrl` if present.

## Phase 5: Streaming / Download

- [ ] Implement `GET /media/:id/stream`:
  - Fetch storage key.
  - Get object stream from S3 (or pipe remote URL).
  - Set `Content-Type` and pass-through status 200.
  - (Bonus) Handle Range headers for video seeking.
- [ ] Add simple fallback: if image, just redirect or stream full object.

## Phase 6: Thumbnails (Optional Early Bonus)

- [ ] Install `sharp` (images) — may need build tools.
- [ ] On upload (if image): generate resized (e.g., width 320) buffer.
- [ ] Upload thumbnail to `thumbnails/` prefix in bucket.
- [ ] Save `thumbnailKey` or `thumbnailUrl`.
- [ ] Expose in list & detail.

## Phase 7: Video Metadata (Optional)

- [ ] Install `fluent-ffmpeg` & ensure `ffmpeg` binary installed locally.
- [ ] Run probe to extract duration, width/height.
- [ ] Store in DB fields.

## Phase 8: Frontend – Upload UI

- [ ] Create `/apps/frontend/src/app/components/UploadForm.tsx`.
- [ ] Fields: title, description, file input.
- [ ] On submit: build `FormData`, POST to backend.
- [ ] Show upload progress (use `XMLHttpRequest` or `fetch` streaming fallback: simplest skip progress initially).
- [ ] After success: clear form and trigger refetch of list.

## Phase 9: Frontend – Media List & Playback

- [ ] Create hook `useMediaList` (fetch `/media`).
- [ ] Render cards: title, createdAt (formatted), type.
- [ ] Show thumbnail if present else placeholder.
- [ ] Clicking card opens detail page `/media/[id]`.
- [ ] Detail page:
  - If image: `<img src={presignedUrl || stream endpoint}>`.
  - If video: `<video controls src="/api/proxy-to-backend-or-presigned" />`.
- [ ] Add loading + empty states.

## Phase 10: Frontend Integration Quality

- [ ] Handle fetch errors (toast or inline message).
- [ ] Display file size (convert bytes → KB/MB).
- [ ] Relative time display (e.g., “2m ago”).
- [ ] Light styling (CSS grid) for list.

## Phase 11: Testing (Backend Focus)

- [ ] Unit test service: mock Prisma + storage; test success & invalid mime.
- [ ] E2E test upload + list using supertest and an in-memory / test bucket stub.
- [ ] Add script for running tests in CI.

## Phase 12: Documentation

- [ ] Create `docs/system-design.md` with:
  - Architecture diagram (Mermaid).
  - Data flow (Upload, List, Stream).
  - Stack justification (Nest + Next + Prisma + Firebase Storage).
  - Scaling ideas (CDN, transcoding pipeline, async workers, auth, caching, monitoring).
- [ ] Update root `README.md`:
  - Quick start.
  - Environment variables table.
  - Example API requests.
  - How to run tests.

## Phase 13: Demo Prep

- [ ] Draft demo script: (1) Start services (2) Upload file (3) Show list (4) Stream/playback (5) Show code (6) Mention improvements.
- [ ] Record 2–3 minute screen capture.
- [ ] Host video (unlisted YouTube or attach if allowed) and link in README.

## Phase 14: Optional Enhancements

### Realtime

- [ ] Add WebSocket gateway broadcasting new upload.
- [ ] Frontend subscribes and prepends new item without refresh.

### Authentication

- [ ] Add `User` model.
- [ ] Register/login with JWT.
- [ ] Protect upload & list endpoints.

### Deployment

- [ ] Add Dockerfile for backend (multi-stage build).
- [ ] Provision Postgres (Render/Railway).
- [ ] Deploy backend (Render / Railway) & set env vars.
- [ ] Deploy frontend (Vercel) with NEXT_PUBLIC_API_BASE_URL.
- [ ] Test full flow in production URLs.

### Performance & Ops

- [ ] Add logging (pino or Nest logger) for uploads.
- [ ] Add rate limiting (@nestjs/throttler).
- [ ] Add S3 object caching headers (thumbnails, images) via response headers or CloudFront config.
- [ ] Add health endpoint `/health` returning DB + storage status.

## Phase 15: Finalization

- [ ] Create `.env.example` & `.env.local.example` (no secrets).
- [ ] Ensure `.gitignore` excludes `.env`, large assets, `node_modules`.
- [ ] Run clean clone test: follow README exactly—confirm works.
- [ ] Tag release `v1.0.0`.

---

## Minimal Path to First Working Demo (Shortcut)

If you get overwhelmed, do ONLY these first:

1. Phase 0 basics.
2. Skip model changes (use existing `File`).
3. Implement simple upload that stores file locally (temp folder) & saves a placeholder URL path.
4. List files + basic `<img>` or `<video>` (local static serve).
5. THEN add S3.

---

## Suggested Commit Milestones

- chore: add env + docker setup
- feat: extend prisma model for media
- feat: implement upload endpoint
- feat: list & stream endpoints
- feat: frontend upload form
- feat: media list & playback
- feat: thumbnails (optional)
- docs: add system design + README updates
- chore: add tests
- chore: deployment config

---

## Troubleshooting Notes

| Problem                                      | Likely Cause                                 | Fix                                                                                                                      |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Prisma cannot connect                        | Wrong DATABASE_URL                           | Check port, user, db name                                                                                                |
| Sharp install fails                          | Missing build deps                           | Install build-essential, libvips                                                                                         |
| Access denied to stored object (S3/Firebase) | Incorrect bucket rules or object permissions | For S3: use presigned URL or fix IAM/policy. For Firebase: generate a signed URL or update storage rules for read access |
| Video not seeking                            | No Range support                             | Implement partial content handling in stream endpoint                                                                    |

---

## Future Improvements (Brainstorm)

- Async processing queue (BullMQ) for thumbnails/transcoding.
- Multiple resolutions (1080p/720p) via encoding pipeline.
- CDN (CloudFront) in front of S3 for performance.
- Signed permanent URLs with short TTL.
- Metrics (Prometheus) + dashboards.
- OpenAPI/Swagger docs for backend.

---

Feel free to ask: “What next?” and I can guide you through implementing each block.

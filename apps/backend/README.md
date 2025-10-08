## Backend (NestJS API)

Project-specific backend documentation. For overall project overview see root `README.md`.

### Stack

- NestJS 11 (modular: Auth, Media, Prisma, SDK)
- Prisma ORM (local PostgreSQL)
- (Future) object storage service for binary media
- JWT (passport-jwt) + Argon2 hashing
  (Thumbnail generation currently not implemented; `thumbnailUrl` reserved.)

### Run & Dev

```
pnpm install
pnpm prisma migrate dev --name init
pnpm prisma generate
pnpm start:dev
```

Prod build:

```
pnpm build
pnpm start:prod
```

### Env (.env.example)

```
DATABASE_URL=postgresql://...
JWT_SECRET=dev-secret
```

### Core Endpoints

| Method | Path           | Notes                                        |
| ------ | -------------- | -------------------------------------------- |
| POST   | /auth/register | Body: { email, password } -> { accessToken } |
| POST   | /auth/login    | Body: { email, password } -> { accessToken } |
| GET    | /auth/me       | Requires Bearer token                        |
| POST   | /media         | Multipart: title, description?, file (≤50MB) |
| GET    | /media         | List user files                              |
| GET    | /media/:id     | Single item metadata                         |

### Upload Lifecycle

1. Validate size & MIME
2. Persist file binary to storage service (current placeholder implementation)
3. Persist file row
4. Return contract (shared type from `@media/contracts`)

### Data Shape (MediaItem)

```
{
  id, title, description?, url, type, mimeType?, size?, uploadedAt, thumbnailUrl?
}
```

### Thumbnails

`thumbnailUrl` is currently always null; future work may add background generation.

### Useful Commands

```
pnpm prisma studio    # inspect DB
pnpm prisma migrate dev --name add_field
pnpm test             # unit
pnpm test:e2e         # e2e
```

### Future Enhancements

- Range-based streaming endpoint
- Video poster extraction (ffmpeg)
- Background jobs (thumbnails, transcoding)
- Rich technical metadata capture

---

Refer to root documentation for architecture diagrams & roadmap.

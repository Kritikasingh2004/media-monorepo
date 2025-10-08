## Frontend (Next.js)

Provides the user interface for authentication, uploading, and browsing media.

### Stack

- Next.js (App Router)
- React 19
- TypeScript
- Tailwind CSS + shadcn/ui + Radix primitives
- Axios for API calls

### Dev Commands

```
pnpm install           # (root) installs all workspaces
pnpm dev               # (from root) runs both backend + frontend concurrently
pnpm --filter frontend dev   # run frontend only
pnpm build && pnpm start     # production build & serve
```

### Environment

`.env.example`:

```
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

If omitted the code may fallback to relative API paths (depending on implementation in `lib/api.ts`).

### Auth Flow

1. User registers or logs in -> receives `accessToken` (JWT)
2. Token stored client-side (context/hook) and attached as `Authorization: Bearer <token>` on requests
3. Expired tokens yield 401 -> UI can redirect to login

### Core Components

- `UploadForm` – multipart upload handling
- `MediaGrid` – displays user media items
- `AuthContext` – simple provider for token + user state
- `useMedia` – custom hook encapsulating fetch logic

### Adding New API Calls

Extend `lib/api.ts` with helper functions that automatically include the Bearer token from context.

### Styling

- Tailwind utility classes for layout
- shadcn/ui for consistent, accessible primitives (buttons, dialogs)

### Future Enhancements

- Client-side caching layer (SWR / React Query)
- Drag & drop uploads with progress indication
- Infinite scrolling / virtualized grid
- Inline video playback & poster frames

### Testing (Planned)

Recommended: React Testing Library + Playwright for end-to-end coverage.

Refer to root `README.md` for global setup & architecture.

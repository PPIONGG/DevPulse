# DevPulse

Developer productivity hub — a personal dashboard for tracking work, managing knowledge, and storing code snippets.

## Tech Stack

- **Frontend:** Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5, Tailwind CSS v4, shadcn/ui (Radix primitives)
- **Backend:** Go 1.24 (net/http), PostgreSQL 16, Docker
- **Auth:** Session-based cookies (HttpOnly, 30-day expiry), GitHub OAuth via Go backend
- **Icons:** lucide-react
- **Syntax highlighting:** Shiki (github-dark theme)
- **Toasts:** sonner
- **Theme:** next-themes (light/dark mode)
- **Avatar crop:** react-image-crop (circular 256×256 JPEG)
- **Package manager:** npm (not yarn/pnpm/bun)

## Project Structure

```
DevPulse/
├── frontend/                 # Next.js app
│   └── src/
│       ├── app/              # App Router pages & layouts
│       │   ├── page.tsx      # Root — redirects to /dashboard
│       │   ├── layout.tsx    # Root layout (AuthProvider, Toaster, ThemeProvider)
│       │   ├── global-error.tsx / not-found.tsx
│       │   ├── (app)/        # Authenticated layout group (sidebar + header)
│       │   │   ├── layout.tsx          # AuthGuard + sidebar + mobile nav
│       │   │   ├── error.tsx / not-found.tsx
│       │   │   ├── dashboard/
│       │   │   ├── knowledge-base/
│       │   │   │   ├── page.tsx        # Redirects to /articles
│       │   │   │   ├── articles/       # CRUD articles with search & tag filter
│       │   │   │   └── bookmarks/      # CRUD bookmarks with search & tag filter
│       │   │   ├── code-snippets/
│       │   │   │   ├── page.tsx        # Redirects to /my-snippets
│       │   │   │   ├── my-snippets/    # CRUD personal snippets
│       │   │   │   └── shared/         # Browse public snippets from others
│       │   │   ├── work-log/
│       │   │   └── settings/           # Profile management + avatar upload/crop
│       │   └── auth/
│       │       └── login/              # Login + register + GitHub OAuth
│       ├── proxy.ts          # Middleware — checks session_token cookie, redirects to /auth/login
│       ├── components/
│       │   ├── layout/       # AppSidebar, MobileSidebar, UserMenu, NavItem, NavGroup, AuthGuard
│       │   ├── ui/           # shadcn/ui primitives (19 components — do not edit by hand)
│       │   ├── skeletons.tsx         # All skeleton loading components
│       │   ├── snippet-card.tsx / snippet-form.tsx
│       │   ├── work-log-card.tsx / work-log-form.tsx
│       │   ├── article-card.tsx / article-form.tsx
│       │   ├── bookmark-card.tsx / bookmark-form.tsx
│       │   └── code-block.tsx       # Shiki syntax-highlighted code display
│       ├── config/
│       │   ├── navigation.ts # Sidebar nav items (hierarchical with NavGroups)
│       │   ├── languages.ts  # 30+ programming languages for snippet selector
│       │   └── categories.ts # Work log categories with color styling
│       ├── hooks/            # Custom React hooks (use-snippets, use-shared-snippets, use-work-logs, use-articles, use-bookmarks, use-dashboard, use-profile, use-avatar-upload)
│       ├── lib/
│       │   ├── api/          # API client (fetch wrapper with credentials, 15s default timeout)
│       │   ├── services/     # API service functions (snippets, work-logs, articles, bookmarks, dashboard, profiles, storage)
│       │   ├── types/        # Shared TypeScript types (database.ts)
│       │   └── utils/        # cn() class merger, withTimeout() helper
│       └── providers/        # AuthProvider (wraps entire app)
├── backend/                  # Go API server
│   ├── main.go              # Entry point — wires config, DB, repos, handlers, router + session cleanup goroutine
│   ├── config/              # Env var loading (reads .env and ../.env)
│   ├── database/            # pgxpool connection + embedded SQL migrations (auto-run on startup)
│   ├── models/              # Go structs (json tags match frontend types)
│   ├── repository/          # DB queries (all include user_id WHERE for authz)
│   ├── handlers/            # HTTP handlers (auth, profile, snippets, work-logs, articles, bookmarks, dashboard, health)
│   ├── helpers/             # JSON response/request/context helpers
│   ├── middleware/          # CORS, auth (session cookie), logger, JSON content-type
│   ├── router/              # All route definitions
│   ├── uploads/avatars/     # Runtime avatar storage (gitignored)
│   ├── Dockerfile           # Multi-stage build (Go 1.24 Alpine → minimal runtime)
│   └── go.mod               # pgx/v5, google/uuid, x/crypto, x/oauth2
├── docs/                     # Project documentation
│   ├── 2026-02-25-bug-log.md  # Phase 1 bug chronicle (12 bugs, all resolved)
│   └── modules/             # 8 planned feature specs (calculator → kanban)
└── docker-compose.yml        # PostgreSQL 16 + backend
```

## Key Conventions

- **UI components:** Use `npx shadcn@latest add <component>` — never hand-edit files in `components/ui/`
- **API calls:** All backend calls go through `lib/api/client.ts` (fetch with `credentials: "include"` and `withTimeout`). Service files in `lib/services/` use `api.get/post/put/delete`. Components use custom hooks from `hooks/`, not direct API calls.
- **Types:** Database table types live in `lib/types/database.ts`
- **Auth:** Session-based cookies via Go backend. `AuthProvider` calls `GET /api/auth/me` on mount. Use `useAuth()` to access user/profile.
- **Routing:** App Router with `(app)` route group for authenticated pages. Proxy (`src/proxy.ts`) checks `session_token` cookie. Next.js `rewrites` proxy `/api/*` and `/uploads/*` to Go backend (localhost:8080).
- **Error handling:** Custom error/not-found pages at root (`app/not-found.tsx`, `app/global-error.tsx`) and app level (`app/(app)/error.tsx`, `app/(app)/not-found.tsx`). Fetch errors show inline banners with "Try again" button on pages. Mutation errors use `toast.error()` from sonner.
- **Hooks pattern:** All data hooks use `mountedRef` to guard `setState` after unmount. Mutations call `toast.success()` on success. `toggleFavorite` uses optimistic update with `toast.error()` on revert. Dashboard uses `Promise.allSettled` for partial failure resilience.
- **Navigation:** Sidebar nav items are defined in `config/navigation.ts` — add new pages there.
- **Loading states:** All list pages use skeleton card components from `components/skeletons.tsx` instead of text spinners. New skeletons should match the shape of their corresponding card component.
- **Styling:** Tailwind CSS v4 with CSS variables for theming. Use `cn()` from `lib/utils` for conditional classes. Light/dark mode via `next-themes`.
- **Forms:** Dialog-based (create/edit share same form component). Delete uses `AlertDialog` for confirmation.
- **Data flow:** Pages → hooks → services → API client. Never skip layers.

## Commands

```bash
# Frontend
cd frontend
npm install          # Install dependencies
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Production build (also type-checks)
npm run lint         # ESLint

# Backend
cd backend
go run .             # Dev server (http://localhost:8080)
go build .           # Build binary

# Database
docker compose up db -d   # Start PostgreSQL (migrations run on backend startup)
```

## Environment Variables

Backend (`.env` at project root):
```
DATABASE_URL=postgres://devpulse:devpulse@localhost:5432/devpulse?sslmode=disable
SESSION_SECRET=<random-64-hex-string>
FRONTEND_URL=http://localhost:3000
GITHUB_CLIENT_ID=<from-github>
GITHUB_SECRET=<from-github>
GITHUB_CALLBACK_URL=http://localhost:8080/api/auth/github/callback
UPLOADS_DIR=./uploads
PORT=8080
```

Frontend (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=     # empty = use Next.js rewrites (default for dev)
```

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (`{"status":"ok"}`) |
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/github` | Redirect to GitHub OAuth |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |

### Protected (session cookie required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Get current user + profile |
| GET/PUT | `/api/profile` | Get/update profile |
| POST | `/api/profile/avatar` | Upload avatar (multipart) |
| GET/POST | `/api/snippets` | List/create snippets |
| GET | `/api/snippets/shared` | List public snippets from others |
| PUT/DELETE | `/api/snippets/{id}` | Update/delete snippet |
| GET/POST | `/api/work-logs` | List/create work logs |
| PUT/DELETE | `/api/work-logs/{id}` | Update/delete work log |
| GET/POST | `/api/articles` | List/create articles |
| PUT/DELETE | `/api/articles/{id}` | Update/delete article |
| GET/POST | `/api/bookmarks` | List/create bookmarks |
| PUT/DELETE | `/api/bookmarks/{id}` | Update/delete bookmark |
| GET | `/api/dashboard/stats` | Dashboard counts |
| GET | `/api/dashboard/recent` | Recent items + weekly hours |

## Architecture Rules

1. **New pages:** Create under `app/(app)/your-page/page.tsx` — they automatically get the sidebar layout.
2. **New nav items:** Add to `config/navigation.ts`.
3. **New tables:** Add migration SQL in `backend/database/migrations/`, model in `backend/models/`, repo in `backend/repository/`, handler in `backend/handlers/`, routes in `backend/router/router.go`. On frontend: add type in `lib/types/database.ts`, service in `lib/services/`, hook in `hooks/` (use `mountedRef` + toast pattern).
4. **Components that need auth:** Use `useAuth()` from `providers/auth-provider`.
5. **Server components** are the default. Add `"use client"` only when you need hooks/interactivity.

## Database Tables

All IDs are UUID (`gen_random_uuid()`). All timestamps are `TIMESTAMPTZ`. Content tables have `user_id` FK with `ON DELETE CASCADE`.

| Table | Description | Key columns |
|-------|-------------|-------------|
| `users` | User accounts | email (unique), password_hash (nullable), github_id (unique, nullable) |
| `sessions` | Session tokens | token (PK, 64-hex), user_id, expires_at (30 days) |
| `profiles` | User profiles | id (FK → users.id), display_name, avatar_url, email |
| `snippets` | Code snippets | title, code, language, description, tags (TEXT[]), is_public, is_favorite |
| `work_logs` | Daily work tracking | title, content, date (DATE), category, hours_spent (REAL) |
| `articles` | Knowledge base articles | title, content, tags (TEXT[]), is_favorite |
| `bookmarks` | Saved links | title, url, description, tags (TEXT[]), is_favorite |

Authorization is enforced in Go repository layer via `WHERE user_id = $1` on all queries. Migrations are embedded SQL files that run automatically on backend startup.

## Backend Middleware Stack

Applied in order (outermost → innermost): Logger → CORS → JSONContentType. Auth middleware wraps only protected routes.

- **Auth:** Reads `session_token` cookie → validates via `SessionRepo.FindValid()` → sets `userID` in context
- **CORS:** Allows `FRONTEND_URL` origin with credentials
- **Logger:** Logs `METHOD PATH DURATION` per request
- **JSONContentType:** Sets `Content-Type: application/json` on all responses

## Backend Background Tasks

- **Session cleanup:** Goroutine runs every 1 hour, deletes expired sessions from DB

## Things to Avoid

- Do not call the Go API directly in components — use the service layer and hooks.
- Do not edit `components/ui/` files — they are managed by shadcn CLI.
- Do not use `yarn`, `pnpm`, or `bun` — this project uses `npm`.
- Do not store secrets in code — all env vars go in `.env` / `.env.local`.
- Do not `setState` in hooks without checking `mountedRef.current` — prevents React warnings on unmount.
- Do not add API calls without going through `lib/api/client.ts` — it handles credentials, timeouts, and error parsing.

## Planned Features

8 feature modules are spec'd in `docs/modules/` (ordered by difficulty):
1. Calculator, 2. Expenses, 3. URL Shortener, 4. Blog, 5. Polls, 6. Habit Tracker, 7. Flashcards (SM-2), 8. Kanban Board

Each spec includes DB schema, API endpoints, and UI patterns following existing architecture.

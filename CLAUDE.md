# DevPulse

Developer productivity hub — a personal dashboard with code snippets, expense tracking, habit tracking, kanban boards, pomodoro timer, environment vault, JSON tools, and a calculator.

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
│       │   │   ├── code-snippets/
│       │   │   │   ├── page.tsx        # Redirects to /my-snippets
│       │   │   │   ├── my-snippets/    # CRUD personal snippets
│       │   │   │   └── shared/         # Browse public snippets from others
│       │   │   ├── expenses/           # Expense tracker with categories
│       │   │   ├── habits/             # Habit tracker with streaks
│       │   │   ├── kanban/             # Kanban boards with columns & cards
│       │   │   ├── pomodoro/           # Pomodoro timer with stats
│       │   │   ├── env-vault/          # Environment variable vault
│       │   │   ├── json-tools/         # JSON/YAML formatter, converter, diff, tree
│       │   │   ├── calculator/         # Calculator with history
│       │   │   └── settings/           # Profile management + avatar upload/crop
│       │   └── auth/
│       │       └── login/              # Login + register + GitHub OAuth
│       ├── proxy.ts          # Middleware — checks session_token cookie, redirects to /auth/login
│       ├── components/
│       │   ├── layout/       # AppSidebar, MobileSidebar, UserMenu, NavItem, NavGroup, AuthGuard
│       │   ├── ui/           # shadcn/ui primitives (19 components — do not edit by hand)
│       │   ├── skeletons.tsx         # All skeleton loading components
│       │   ├── snippet-card.tsx / snippet-form.tsx
│       │   ├── expense-card.tsx / expense-form.tsx / expense-summary.tsx
│       │   ├── habit-card.tsx / habit-form.tsx
│       │   ├── kanban-board-card.tsx / kanban-board-form.tsx / kanban-board-view.tsx / kanban-card-form.tsx
│       │   ├── pomodoro-timer.tsx / pomodoro-stats.tsx / pomodoro-history.tsx / pomodoro-settings.tsx
│       │   ├── vault-card.tsx / vault-form.tsx / vault-detail.tsx / vault-import-dialog.tsx / variable-row.tsx
│       │   ├── json-formatter.tsx / json-converter.tsx / json-diff.tsx / json-tree-view.tsx / json-document-card.tsx / json-document-form.tsx
│       │   ├── calculator-display.tsx  # Calculator UI + safe expression evaluator
│       │   └── code-block.tsx       # Shiki syntax-highlighted code display
│       ├── config/
│       │   ├── navigation.ts # Sidebar nav items (hierarchical with NavGroups)
│       │   ├── languages.ts  # 30+ programming languages for snippet selector
│       │   ├── expense-categories.ts  # Expense category definitions
│       │   ├── habit-colors.ts        # Habit color palette
│       │   ├── kanban-config.ts       # Kanban board configuration
│       │   ├── pomodoro.ts            # Pomodoro timer defaults
│       │   └── environments.ts        # Env vault environment types
│       ├── hooks/            # Custom React hooks (use-snippets, use-shared-snippets, use-calculator, use-dashboard, use-profile, use-avatar-upload, use-expenses, use-habits, use-kanban, use-pomodoro, use-env-vaults, use-json-documents)
│       ├── lib/
│       │   ├── api/          # API client (fetch wrapper with credentials, 15s default timeout)
│       │   ├── services/     # API service functions (snippets, calculations, dashboard, profiles, storage, expenses, habits, kanban, pomodoro, env-vaults, json-documents)
│       │   ├── types/        # Shared TypeScript types (database.ts)
│       │   └── utils/        # cn() class merger, withTimeout() helper
│       └── providers/        # AuthProvider (wraps entire app)
├── backend/                  # Go API server
│   ├── main.go              # Entry point — wires config, DB, repos, handlers, router + session cleanup goroutine
│   ├── config/              # Env var loading (reads .env and ../.env)
│   ├── database/            # pgxpool connection + embedded SQL migrations (auto-run on startup)
│   ├── models/              # Go structs (json tags match frontend types)
│   ├── repository/          # DB queries (all include user_id WHERE for authz)
│   ├── handlers/            # HTTP handlers (auth, profile, snippets, calculations, dashboard, health, expenses, habits, kanban, pomodoro, env_vault, json_document)
│   ├── helpers/             # JSON response/request/context helpers
│   ├── middleware/          # CORS, auth (session cookie), logger, JSON content-type
│   ├── router/              # All route definitions
│   ├── uploads/avatars/     # Runtime avatar storage (gitignored)
│   ├── Dockerfile           # Multi-stage build (Go 1.24 Alpine → minimal runtime)
│   └── go.mod               # pgx/v5, google/uuid, x/crypto, x/oauth2
├── docs/                     # Project documentation
│   ├── 2026-02-25-bug-log.md  # Phase 1 bug chronicle (12 bugs, all resolved)
│   └── modules/             # Planned feature specs
└── docker-compose.yml        # PostgreSQL 16 + backend
```

## Key Conventions

- **UI components:** Use `npx shadcn@latest add <component>` — never hand-edit files in `components/ui/`
- **API calls:** All backend calls go through `lib/api/client.ts` (fetch with `credentials: "include"` and `withTimeout`). Service files in `lib/services/` use `api.get/post/put/delete`. Components use custom hooks from `hooks/`, not direct API calls.
- **Types:** Database table types live in `lib/types/database.ts`
- **Auth:** Session-based cookies via Go backend. `AuthProvider` calls `GET /api/auth/me` on mount. Use `useAuth()` to access user/profile.
- **Routing:** App Router with `(app)` route group for authenticated pages. Proxy (`src/proxy.ts`) checks `session_token` cookie. Next.js `rewrites` proxy `/api/*` and `/uploads/*` to Go backend (localhost:8080).
- **Error handling:** Custom error/not-found pages at root (`app/not-found.tsx`, `app/global-error.tsx`) and app level (`app/(app)/error.tsx`, `app/(app)/not-found.tsx`). Fetch errors show inline banners with "Try again" button on pages. Mutation errors use `toast.error()` from sonner.
- **Hooks pattern:** All data hooks use `mountedRef` to guard `setState` after unmount. Mutations call `toast.success()` on success. `toggleFavorite` (snippets) uses optimistic update with `toast.error()` on revert. Dashboard uses `Promise.allSettled` for partial failure resilience.
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
| POST | `/api/snippets/copy/{id}` | Copy a shared snippet |
| PUT/DELETE | `/api/snippets/{id}` | Update/delete snippet |
| GET/POST | `/api/calculations` | List/create calculations |
| DELETE | `/api/calculations/{id}` | Delete single calculation |
| DELETE | `/api/calculations` | Clear all calculations |
| GET/POST | `/api/expenses` | List/create expenses |
| PUT/DELETE | `/api/expenses/{id}` | Update/delete expense |
| GET/POST | `/api/habits` | List/create habits |
| PUT/DELETE | `/api/habits/{id}` | Update/delete habit |
| PATCH | `/api/habits/{id}/archive` | Archive/unarchive habit |
| POST | `/api/habits/{id}/toggle` | Toggle today's completion |
| GET | `/api/habits/completions` | Get completions for date range |
| GET/POST | `/api/kanban/boards` | List/create boards |
| GET/PUT/DELETE | `/api/kanban/boards/{id}` | Get/update/delete board (with columns & cards) |
| POST | `/api/kanban/boards/{boardId}/columns` | Create column |
| PUT/DELETE | `/api/kanban/columns/{id}` | Update/delete column |
| POST | `/api/kanban/columns/{colId}/cards` | Create card |
| PUT/DELETE | `/api/kanban/cards/{id}` | Update/delete card |
| PUT | `/api/kanban/cards/reorder` | Reorder cards (drag & drop) |
| GET/POST | `/api/pomodoro/sessions` | List/create sessions |
| DELETE | `/api/pomodoro/sessions/{id}` | Delete session |
| DELETE | `/api/pomodoro/sessions` | Clear all sessions |
| GET | `/api/pomodoro/stats` | Get pomodoro stats (today/week/total/streak) |
| GET/POST | `/api/env-vaults` | List/create vaults |
| GET/PUT/DELETE | `/api/env-vaults/{id}` | Get/update/delete vault |
| POST | `/api/env-vaults/{id}/variables` | Add variable to vault |
| POST | `/api/env-vaults/{id}/import` | Import variables from .env format |
| PUT/DELETE | `/api/env-variables/{id}` | Update/delete variable |
| GET/POST | `/api/json-documents` | List/create JSON documents |
| PUT/DELETE | `/api/json-documents/{id}` | Update/delete document |
| GET | `/api/dashboard/stats` | Dashboard stats (snippets, expenses, habits, boards) |
| GET | `/api/dashboard/recent` | Recent snippets |

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
| `calculations` | Calculator history | expression, result |
| `expenses` | Expense tracking | title, amount (NUMERIC 10,2), currency, category, date, notes, is_recurring |
| `habits` | Habit definitions | title, description, color, frequency, target_days, is_archived |
| `habit_completions` | Habit completion records | habit_id, completed_date (unique per habit/date) |
| `kanban_boards` | Kanban boards | title, description, is_favorite |
| `kanban_columns` | Board columns | board_id, title, color, position |
| `kanban_cards` | Column cards | column_id, title, description, priority, labels (TEXT[]), due_date, position |
| `pomodoro_sessions` | Pomodoro timer sessions | duration, target_duration, task_label, completed_at |
| `env_vaults` | Environment variable vaults | name, environment, description, is_favorite |
| `env_variables` | Vault key-value pairs | vault_id, key, value, is_secret, position (unique per vault/key) |
| `json_documents` | JSON/YAML documents | title, content, format, description, tags (TEXT[]), is_favorite |

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

## Implemented Feature Modules

All implemented modules are spec'd in `docs/modules/`. Each follows the same architecture (migration → model → repo → handler → route + type → service → hook → page).

| Module | Route | Status |
|--------|-------|--------|
| Calculator | `/calculator` | ✅ Done |
| Expense Tracker | `/expenses` | ✅ Done |
| Habit Tracker | `/habits` | ✅ Done |
| Kanban Board | `/kanban` | ✅ Done |
| Pomodoro Timer | `/pomodoro` | ✅ Done |
| Env Vault | `/env-vault` | ✅ Done |
| JSON Tools | `/json-tools` | ✅ Done |

### Skipped / Not Implemented

| Module | Status |
|--------|--------|
| URL Shortener | ⏭️ Skipped |
| Markdown Blog | ⏭️ Skipped |
| Polls / Voting | ⏭️ Skipped |
| Flashcards (SM-2) | ⏭️ Skipped |
| Regex Playground | 📝 Draft only |

## Calculator

The calculator uses a **recursive descent parser** for safe expression evaluation (no `eval`/`new Function`). Key features:
- Operators: `+`, `−`, `×`, `÷`, `%` (percentage = ÷100)
- Auto-close unclosed parentheses, strip trailing operators
- Implicit multiplication: `2(3)` = 6
- Input validation: prevents consecutive operators, duplicate decimals, invalid leading operators
- Keyboard support: 0-9, +, -, *, /, ., %, (, ), Enter, Escape, Backspace
- Calculation history persisted to DB via `/api/calculations`

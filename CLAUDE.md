# DevPulse

Developer productivity hub — a personal dashboard with code snippets, expense tracking, habit tracking, kanban boards, pomodoro timer, environment vault, JSON tools, SQL practice & academy, admin panel, calculator, time tracker, workflows, and marketplace. Supports Thai/English (i18n).

Detailed references: [API Endpoints](docs/api-endpoints.md) | [Database Schema](docs/database-schema.md)

## Tech Stack

- **Frontend:** Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5, Tailwind CSS v4, shadcn/ui (Radix primitives)
- **Backend:** Go 1.24 (net/http), PostgreSQL 16, Docker
- **Auth:** Session-based cookies (HttpOnly, 30-day expiry), GitHub OAuth, RBAC (user/admin roles)
- **Icons:** lucide-react
- **Syntax highlighting:** Shiki (github-dark theme)
- **Toasts:** sonner
- **Theme:** next-themes (light/dark mode)
- **Avatar crop:** react-image-crop (circular 256x256 JPEG)
- **i18n:** Custom lightweight system — JSON dictionaries + `LanguageProvider` + `useTranslation()` hook (Thai/English)
- **Package manager:** npm (not yarn/pnpm/bun)

## Project Structure

```
DevPulse/
├── frontend/                 # Next.js app
│   └── src/
│       ├── app/              # App Router pages & layouts
│       │   ├── page.tsx      # Root — redirects to /dashboard
│       │   ├── layout.tsx    # Root layout (AuthProvider, LanguageProvider, Toaster, ThemeProvider)
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
│       │   │   ├── sql-practice/       # SQL Practice + Academy + Cheat Sheet
│       │   │   │   ├── page.tsx        # Challenge list (100+ challenges)
│       │   │   │   ├── [slug]/         # Challenge detail + SQL editor
│       │   │   │   ├── learn/          # SQL Academy — structured lessons
│       │   │   │   │   ├── page.tsx    # Module browser
│       │   │   │   │   └── [id]/       # Individual lesson + practice editor
│       │   │   │   └── cheat-sheet/    # SQL quick reference (searchable)
│       │   │   ├── calculator/         # Calculator with history
│       │   │   ├── admin/              # Admin panel (admin role only)
│       │   │   │   ├── navigation/     # Menu Manager — toggle sidebar items + group assignment
│       │   │   │   ├── users/          # User Management — roles, active toggle, delete
│       │   │   │   ├── snippets/       # Snippets Moderation — verify/delete public snippets
│       │   │   │   ├── challenges/     # SQL Challenges — CRUD + test solution
│       │   │   │   ├── stats/          # System Stats — overview, growth, feature usage
│       │   │   │   └── settings/       # Admin Settings — maintenance, announcements, feature toggles
│       │   │   └── settings/           # Profile management + avatar upload/crop
│       │   └── auth/
│       │       └── login/              # Login + register + GitHub OAuth
│       ├── proxy.ts          # Middleware — checks session_token cookie, redirects to /auth/login
│       ├── components/
│       │   ├── layout/       # AppSidebar, MobileSidebar, MobileSidebarWrapper, UserMenu, NavItem, NavGroup, AuthGuard, AnnouncementBar
│       │   ├── ui/           # shadcn/ui primitives — do not edit by hand
│       │   ├── skeletons.tsx
│       │   ├── snippet-card.tsx / snippet-form.tsx
│       │   ├── expense-card.tsx / expense-form.tsx / expense-summary.tsx
│       │   ├── habit-card.tsx / habit-form.tsx
│       │   ├── kanban-board-card.tsx / kanban-board-form.tsx / kanban-board-view.tsx / kanban-card-form.tsx
│       │   ├── pomodoro-timer.tsx / pomodoro-stats.tsx / pomodoro-history.tsx / pomodoro-settings.tsx
│       │   ├── vault-card.tsx / vault-form.tsx / vault-detail.tsx / vault-import-dialog.tsx / variable-row.tsx
│       │   ├── json-formatter.tsx / json-converter.tsx / json-diff.tsx / json-tree-view.tsx / json-document-card.tsx / json-document-form.tsx
│       │   ├── challenge-card.tsx / challenge-editor.tsx / challenge-result.tsx
│       │   ├── calculator-display.tsx
│       │   └── code-block.tsx
│       ├── config/
│       │   ├── navigation.ts # Static nav fallback (dynamic nav loaded from DB via useNavigation)
│       │   ├── languages.ts  # 30+ programming languages for snippet selector
│       │   ├── expense-categories.ts
│       │   ├── habit-colors.ts
│       │   ├── kanban-config.ts
│       │   ├── pomodoro.ts
│       │   ├── environments.ts
│       │   └── sql-practice.ts  # Difficulty/category/status configs (8 categories incl. analytics)
│       ├── hooks/            # use-snippets, use-shared-snippets, use-calculator, use-dashboard, use-profile, use-avatar-upload, use-expenses, use-habits, use-kanban, use-pomodoro, use-env-vaults, use-json-documents, use-sql-practice, use-navigation, use-admin-users, use-admin-snippets, use-admin-challenges, use-admin-stats, use-announcement
│       ├── lib/
│       │   ├── api/          # API client (fetch wrapper with credentials, 15s timeout)
│       │   ├── services/     # snippets, calculations, dashboard, profiles, storage, expenses, habits, kanban, pomodoro, env-vaults, json-documents, sql-practice, navigation, admin
│       │   ├── types/        # Shared TypeScript types (database.ts)
│       │   ├── i18n/          # Translation system
│       │   │   ├── en.json   # English translations (1100+ keys)
│       │   │   ├── th.json   # Thai translations
│       │   │   └── index.ts  # Exports translations, Language type, TranslationKey type
│       │   └── utils/        # cn() class merger, withTimeout() helper
│       └── providers/        # AuthProvider, LanguageProvider (wrap entire app)
├── backend/                  # Go API server
│   ├── main.go              # Entry point — wires config, DB, repos, handlers, router
│   ├── config/              # Env var loading (reads .env and ../.env)
│   ├── database/            # pgxpool + embedded SQL migrations (auto-run on startup)
│   ├── models/              # Go structs (user, session, navigation, sql_practice, dashboard, etc.)
│   ├── repository/          # DB queries (user_id WHERE for authz)
│   ├── handlers/            # HTTP handlers (auth, profile, snippets, calculations, dashboard, health, expenses, habits, kanban, pomodoro, env_vault, json_document, sql_practice, admin)
│   ├── helpers/             # JSON response/request/context helpers (incl. role context)
│   ├── middleware/          # CORS, auth, admin-only, logger, JSON content-type
│   ├── router/              # All route definitions
│   ├── uploads/avatars/     # Runtime avatar storage (gitignored)
│   ├── Dockerfile           # Multi-stage build (Go 1.24 Alpine → minimal runtime)
│   └── go.mod               # pgx/v5, google/uuid, x/crypto, x/oauth2
├── docs/                     # Project documentation
│   ├── api-endpoints.md     # Full API reference
│   └── database-schema.md   # Database tables & migrations
└── docker-compose.yml        # PostgreSQL 16 + backend
```

## Key Conventions

- **UI components:** Use `npx shadcn@latest add <component>` — never hand-edit files in `components/ui/`
- **API calls:** All backend calls go through `lib/api/client.ts` (fetch with `credentials: "include"` and `withTimeout`). Service files use `api.get/post/put/delete`. Components use hooks, not direct API calls.
- **Types:** Database table types live in `lib/types/database.ts`
- **Auth:** Session-based cookies via Go backend. `AuthProvider` calls `GET /api/auth/me` on mount. Use `useAuth()` to access user/profile/role.
- **RBAC:** Users have `role` field (`"user"` or `"admin"`). Backend uses `AdminOnly()` middleware. Frontend checks `user.role === "admin"` for admin UI.
- **Navigation:** Sidebar items stored in `navigation_items` DB table. Admin can toggle visibility via Menu Manager (`/admin/navigation`). Frontend loads dynamically via `useNavigation()` hook. Icon mapping in AppSidebar/MobileSidebar.
- **Routing:** App Router with `(app)` route group for authenticated pages. Proxy (`src/proxy.ts`) checks `session_token` cookie. Next.js `rewrites` proxy `/api/*` and `/uploads/*` to Go backend (localhost:8080).
- **Error handling:** Custom error/not-found pages at root and app level. Fetch errors show inline banners with "Try again". Mutation errors use `toast.error()`.
- **Hooks pattern:** All data hooks use `mountedRef` to guard `setState` after unmount. Mutations call `toast.success()` on success. Dashboard uses `Promise.allSettled` for partial failure resilience.
- **Loading states:** All list pages use skeleton cards from `components/skeletons.tsx`.
- **Styling:** Tailwind CSS v4 with CSS variables. Use `cn()` for conditional classes. Light/dark mode via `next-themes`.
- **Forms:** Dialog-based (create/edit share same form component). Delete uses `AlertDialog`.
- **i18n:** All UI strings use `t("key")` from `useTranslation()` hook. Translations in `lib/i18n/en.json` + `th.json`. Standalone functions outside components receive `t` as a parameter. Technical content (SQL challenges, academy lessons) stays in English. Language preference persisted in `profiles.preferred_language`.
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

## Architecture Rules

1. **New pages:** Create under `app/(app)/your-page/page.tsx` — they automatically get the sidebar layout.
2. **New nav items:** Insert into `navigation_items` DB table via migration. Set `icon` (Lucide name), `path`, `min_role`, `sort_order`.
3. **New tables:** Add migration SQL in `backend/database/migrations/`, model in `backend/models/`, repo in `backend/repository/`, handler in `backend/handlers/`, routes in `backend/router/router.go`. On frontend: add type in `lib/types/database.ts`, service in `lib/services/`, hook in `hooks/` (use `mountedRef` + toast pattern).
4. **Components that need auth:** Use `useAuth()` from `providers/auth-provider`.
5. **Server components** are the default. Add `"use client"` only when you need hooks/interactivity.
6. **Admin-only features:** Use `AdminOnly()` middleware on Go routes + check `user.role === "admin"` on frontend.

## Backend Middleware Stack

Applied in order: Logger → CORS → JSONContentType. Auth middleware wraps protected routes. AdminOnly wraps admin-specific routes.

- **Auth:** Reads `session_token` cookie → validates via `SessionRepo.FindValid()` → sets `userID` + `userRole` in context
- **AdminOnly:** Checks `userRole == "admin"` → returns 403 if not
- **CORS:** Allows `FRONTEND_URL` origin with credentials
- **Logger:** Logs `METHOD PATH DURATION` per request
- **JSONContentType:** Sets `Content-Type: application/json`

## Background Tasks

- **Session cleanup:** Goroutine runs every 1 hour, deletes expired sessions

## Things to Avoid

- Do not call the Go API directly in components — use the service layer and hooks.
- Do not edit `components/ui/` files — they are managed by shadcn CLI.
- Do not use `yarn`, `pnpm`, or `bun` — this project uses `npm`.
- Do not store secrets in code — all env vars go in `.env` / `.env.local`.
- Do not `setState` in hooks without checking `mountedRef.current`.
- Do not add API calls without going through `lib/api/client.ts`.

## Implemented Feature Modules

Each follows the architecture: migration → model → repo → handler → route + type → service → hook → page.

| Module | Route | Status |
|--------|-------|--------|
| Calculator | `/calculator` | Done |
| Expense Tracker | `/expenses` | Done |
| Habit Tracker | `/habits` | Done |
| Kanban Board | `/kanban` | Done |
| Pomodoro Timer | `/pomodoro` | Done |
| Env Vault | `/env-vault` | Done |
| JSON Tools | `/json-tools` | Done |
| SQL Practice | `/sql-practice` | Done |
| SQL Academy | `/sql-practice/learn` | Done |
| SQL Cheat Sheet | `/sql-practice/cheat-sheet` | Done |
| Time Tracker | `/time-tracker` | Done |
| Workflows | `/workflows` | Done |
| Marketplace | `/marketplace` | Done |
| Admin Menu Manager | `/admin/navigation` | Done |
| Admin User Management | `/admin/users` | Done |
| Admin Snippets Moderation | `/admin/snippets` | Done |
| Admin SQL Challenges | `/admin/challenges` | Done |
| Admin System Stats | `/admin/stats` | Done |
| Admin Settings | `/admin/settings` | Done |
| Multi-language (i18n) | All pages | Done |

## Calculator

Recursive descent parser for safe expression evaluation (no `eval`/`new Function`):
- Operators: `+`, `-`, `*`, `/`, `%` (percentage = /100)
- Auto-close parentheses, strip trailing operators, implicit multiplication
- Keyboard support: 0-9, operators, Enter, Escape, Backspace
- History persisted to DB via `/api/calculations`

## SQL Practice & Academy

**SQL Practice** — LeetCode-style SQL challenges (100+ across 8 categories):
- **Categories:** SELECT, WHERE & filtering, JOINs, aggregation, subqueries, window functions, CTEs, analytics
- **Difficulties:** Easy, Medium, Hard — color-coded green/yellow/red
- **Sandbox judge:** Transaction isolation + 5s timeout + auto-rollback
- **Features:** Run (preview), Submit (judge), EXPLAIN ANALYZE, table preview, top solutions leaderboard, daily challenge on dashboard
- **Progress:** Per-user solve status, attempt count, best execution time, practice streak

**SQL Academy** — Structured learning path:
- Lessons grouped by module (intro, filtering, aggregation, joins, subqueries, window functions, CTEs, data modification)
- Interactive editor with practice queries and expected output validation
- Per-lesson completion tracking

**SQL Cheat Sheet** — Quick reference with 8 categories, searchable, copy-to-clipboard

## Admin System

- **RBAC:** Users have `role` field. First registered user auto-promoted to admin (migration 030).
- **Menu Manager** (`/admin/navigation`): Toggle visibility of sidebar items for all users. Dashboard is locked (cannot hide).
- **Admin middleware:** `AdminOnly()` wraps admin-only routes, returns 403 for non-admin users.

## Multi-language (i18n)

Hybrid approach — UI chrome translated to Thai/English, technical content stays in English.

- **Architecture:** Custom lightweight system (no external library). `LanguageProvider` context wraps the app inside `AuthProvider`.
- **Translation files:** `lib/i18n/en.json` (1100+ keys) and `th.json`. Organized by feature namespace (e.g., `sidebar.*`, `expenses.*`, `timeTracker.*`).
- **Usage:** `const { t } = useTranslation()` in components. `t("key")` returns translated string, falls back to English if key missing.
- **Standalone functions:** Functions outside components (formatters, helpers) receive `t` as parameter: `function formatX(value, t: (key: TranslationKey) => string)`.
- **Language switcher:** Available in UserMenu (Globe icon) and Settings page (dropdown).
- **Persistence:** `profiles.preferred_language` column in DB. Language change calls `updateProfile()` + `refreshProfile()`.

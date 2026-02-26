# DevPulse

Developer productivity hub — a personal dashboard for tracking work, managing knowledge, and storing code snippets.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix primitives)
- **Backend:** Go (net/http), Docker
- **Auth & DB:** Supabase Cloud (Auth with GitHub OAuth, PostgreSQL, Storage)
- **Package manager:** npm (not yarn/pnpm/bun)

## Project Structure

```
DevPulse/
├── frontend/                 # Next.js app
│   └── src/
│       ├── app/              # App Router pages & layouts
│       │   ├── (app)/        # Authenticated layout group (sidebar + header)
│       │   │   ├── dashboard/
│       │   │   ├── knowledge-base/
│       │   │   ├── code-snippets/
│       │   │   ├── work-log/
│       │   │   └── settings/
│       │   └── auth/         # Login page + OAuth callback route
│       ├── components/
│       │   ├── layout/       # AppSidebar, MobileSidebar, UserMenu, NavItem, NavGroup
│       │   ├── ui/           # shadcn/ui primitives (do not edit by hand)
│       │   ├── snippet-card.tsx / snippet-form.tsx
│       │   ├── work-log-card.tsx / work-log-form.tsx
│       │   ├── article-card.tsx / article-form.tsx
│       │   ├── bookmark-card.tsx / bookmark-form.tsx
│       │   └── code-block.tsx       # Syntax-highlighted code display
│       ├── config/           # Navigation, languages, categories configs
│       ├── hooks/            # Custom React hooks (use-snippets, use-shared-snippets, use-work-logs, use-articles, use-bookmarks, use-dashboard, use-profile, use-avatar-upload)
│       ├── lib/
│       │   ├── supabase/     # Client/server/middleware Supabase helpers
│       │   ├── services/     # Supabase service functions (snippets, work-logs, articles, bookmarks, dashboard, profiles, storage)
│       │   ├── types/        # Shared TypeScript types (database types)
│       │   └── utils/        # Utility helpers (with-timeout)
│       └── providers/        # AuthProvider (wraps entire app)
├── backend/                  # Go API server
│   ├── main.go              # Entry point (net/http server)
│   ├── handlers/            # HTTP handlers (health.go)
│   ├── Dockerfile
│   └── go.mod
├── docs/                     # Project documentation
└── docker-compose.yml
```

## Key Conventions

- **UI components:** Use `npx shadcn@latest add <component>` — never hand-edit files in `components/ui/`
- **Supabase calls:** All Supabase queries go through `lib/services/`. Components use custom hooks from `hooks/`, not direct Supabase calls. All service functions are wrapped with `withTimeout()` (15s default, 30s for uploads).
- **Types:** Database table types live in `lib/types/database.ts`
- **Auth:** Supabase Auth with GitHub OAuth. `AuthProvider` wraps the app in root layout. Use `useAuth()` to access user/profile.
- **Routing:** App Router with `(app)` route group for authenticated pages. Proxy (`src/proxy.ts`) handles session refresh.
- **Error handling:** Custom error/not-found pages at root (`app/not-found.tsx`, `app/global-error.tsx`) and app level (`app/(app)/error.tsx`, `app/(app)/not-found.tsx`). Fetch errors show inline banners with "Try again" button on pages. Mutation errors use `toast.error()` from sonner.
- **Hooks pattern:** All data hooks use `mountedRef` to guard `setState` after unmount. Mutations call `toast.success()` on success. `toggleFavorite` uses optimistic update with `toast.error()` on revert. Dashboard uses `Promise.allSettled` for partial failure resilience.
- **Navigation:** Sidebar nav items are defined in `config/navigation.ts` — add new pages there.
- **Styling:** Tailwind CSS v4 with CSS variables for theming. Use `cn()` from `lib/utils` for conditional classes.

## Commands

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Production build (also type-checks)
npm run lint         # ESLint
```

## Environment Variables

Frontend (`frontend/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

## Architecture Rules

1. **New pages:** Create under `app/(app)/your-page/page.tsx` — they automatically get the sidebar layout.
2. **New nav items:** Add to `config/navigation.ts`.
3. **New Supabase tables:** Add type in `lib/types/database.ts`, service in `lib/services/` (wrap with `withTimeout`), hook in `hooks/` (use `mountedRef` + toast pattern).
4. **Components that need auth:** Use `useAuth()` from `providers/auth-provider`.
5. **Server components** are the default. Add `"use client"` only when you need hooks/interactivity.

## Supabase Tables

| Table | Description | Key columns |
|-------|-------------|-------------|
| `profiles` | User profiles (synced from auth) | display_name, avatar_url, email |
| `snippets` | Code snippets | title, code, language, tags, is_public, is_favorite |
| `work_logs` | Daily work tracking | title, content, date, category, hours_spent |
| `articles` | Knowledge base articles | title, content, tags, is_favorite |
| `bookmarks` | Saved links | title, url, description, tags, is_favorite |

All tables have RLS enabled — users can only access their own rows.

## Things to Avoid

- Do not call Supabase directly in components — use the service layer and hooks.
- Do not edit `components/ui/` files — they are managed by shadcn CLI.
- Do not use `yarn`, `pnpm`, or `bun` — this project uses `npm`.
- Do not store secrets in code — all env vars go in `.env.local`.
- Do not add service functions without `withTimeout()` wrapping — all Supabase calls must have a timeout.
- Do not `setState` in hooks without checking `mountedRef.current` — prevents React warnings on unmount.

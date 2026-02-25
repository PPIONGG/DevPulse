# DevPulse

Developer productivity hub — a modular full-stack monorepo.

## Architecture

```
DevPulse/
├── frontend/                          # Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout with AuthProvider
│   │   │   ├── page.tsx               # Redirects to /dashboard
│   │   │   ├── (app)/                 # Authenticated route group (shared sidebar layout)
│   │   │   │   ├── layout.tsx         # Sidebar layout (desktop + mobile)
│   │   │   │   ├── dashboard/
│   │   │   │   ├── knowledge-base/
│   │   │   │   ├── code-snippets/
│   │   │   │   ├── work-log/
│   │   │   │   └── settings/          # Profile editing (name, avatar with crop)
│   │   │   └── auth/
│   │   │       ├── login/             # Email/password + GitHub OAuth
│   │   │       └── callback/          # OAuth callback handler
│   │   ├── components/
│   │   │   ├── layout/                # Sidebar, nav item, mobile sidebar, user menu
│   │   │   └── ui/                    # shadcn/ui components
│   │   ├── config/navigation.ts       # Centralized nav config (modularity core)
│   │   ├── lib/supabase/              # Browser client, server client, middleware helper
│   │   ├── providers/auth-provider.tsx # Auth context + profile from DB
│   │   └── middleware.ts              # Auth-protected route middleware
│   └── .env.local.example
├── backend/                           # Go HTTP server (stdlib only)
│   ├── main.go                        # Entry point, modular route registration
│   ├── handlers/health.go             # GET /health endpoint
│   ├── go.mod
│   └── Dockerfile
├── docker-compose.yml                 # Go backend service
├── docs/                              # Development logs and documentation
├── .env.example
└── .gitignore
```

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Frontend   | Next.js 16, TypeScript, Tailwind CSS v4         |
| UI         | shadcn/ui (button, card, sheet, tabs, avatar...) |
| Auth       | Supabase Auth (GitHub OAuth + email/password)   |
| Database   | Supabase (PostgreSQL) — profiles table          |
| Storage    | Supabase Storage — avatars bucket               |
| Backend    | Go 1.22 (net/http, stdlib only)                 |
| Container  | Docker + Docker Compose                         |

## Prerequisites

- Node.js 18+
- Go 1.22+
- Docker & Docker Compose (optional, for containerized backend)
- A [Supabase](https://supabase.com) project

## Setup

### 1. Clone and install

```bash
git clone https://github.com/PPIONGG/DevPulse.git
cd DevPulse
cd frontend && npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy the **Project URL** and **anon key**

### 3. Environment variables

```bash
cp frontend/.env.local.example frontend/.env.local
```

Fill in the values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Database setup

Run this SQL in **Supabase Dashboard > SQL Editor**:

```sql
-- Profiles table (skip if already exists)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'user_name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 5. Storage setup (for avatar uploads)

Run in SQL Editor:

```sql
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Avatar select" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Avatar insert" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatar update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatar delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 6. GitHub OAuth (optional)

Skip this if you only want email/password login.

1. Go to [GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers) > **New OAuth App**
2. Fill in:
   - **Application name**: `DevPulse`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `https://<your-project>.supabase.co/auth/v1/callback`
3. Copy **Client ID** and generate **Client Secret**
4. Go to **Supabase Dashboard > Authentication > Providers > GitHub** > Enable
5. Paste Client ID and Client Secret > **Save**

### 7. Auth settings (recommended for dev)

Go to **Supabase Dashboard > Authentication > Settings** and disable **"Confirm email"** so users can sign in immediately after registration.

### 8. Run

```bash
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 9. Backend (optional)

```bash
cd backend && go run main.go
# or
docker-compose up
```

Test: `curl http://localhost:8080/health`

## Features

- **Authentication** — GitHub OAuth + email/password registration and login
- **User profiles** — Display name, avatar with image crop, stored in Supabase
- **Responsive sidebar** — Desktop sidebar + mobile sheet, auto-highlights active page
- **Modular architecture** — Add new features by editing one config file + one page folder

## Adding New Modules

1. Add a nav entry in `frontend/src/config/navigation.ts`
2. Create a page at `frontend/src/app/(app)/your-module/page.tsx`

The sidebar and routing handle everything automatically.

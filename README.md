# DevPulse

Developer productivity hub — a modular full-stack monorepo.

## Architecture

```
DevPulse/
├── frontend/          # Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
├── backend/           # Go HTTP server
├── docker-compose.yml # Go backend service
└── .env.example       # Required environment variables
```

## Prerequisites

- Node.js 18+
- Go 1.22+
- Docker & Docker Compose (optional, for containerized backend)
- A [Supabase](https://supabase.com) project with GitHub OAuth configured

## Setup

### 1. Environment Variables

```bash
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
```

Fill in your Supabase project URL and anon key in both files.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app has a responsive sidebar with navigation to all modules.

### 3. Backend

**Local:**

```bash
cd backend
go run main.go
```

**Docker:**

```bash
docker-compose up
```

The backend runs on [http://localhost:8080](http://localhost:8080). Test with:

```bash
curl http://localhost:8080/health
# {"status":"ok","service":"devpulse-backend"}
```

## Supabase Auth

Authentication uses GitHub OAuth via Supabase. To set up:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable GitHub provider in Authentication > Providers
3. Add your GitHub OAuth app credentials
4. Set the callback URL to `http://localhost:3000/auth/callback`
5. Copy the project URL and anon key to your `.env.local`

## Adding New Modules

The frontend is designed for easy extensibility:

1. Add a nav entry in `frontend/src/config/navigation.ts`
2. Create a new page at `frontend/src/app/(app)/your-module/page.tsx`

That's it — the sidebar and routing handle everything automatically.

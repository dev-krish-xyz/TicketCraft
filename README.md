# TicketCraft

AI-powered bug-to-ticket platform. Ingests signals from Sentry, Slack, logs, terminals, and screenshots, then uses AI to automatically generate structured engineering tickets.

## Features

- **Signal ingestion** — webhooks from Sentry & Slack, manual text/screenshot upload via dashboard
- **AI ticket generation** — Gemini 2.0 Flash (Groq fallback) analyzes signals and generates prioritized tickets with root cause and confidence score
- **Deduplication** — SHA-256 fingerprinting prevents duplicate signals
- **Team management** — multi-team support with role-based access
- **Dashboard** — signals list, ticket list/detail, stats overview

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 (GitHub OAuth) |
| AI | Google Gemini 2.0 Flash + Groq fallback |
| File uploads | Uploadthing |
| Validation | Zod |

## Project Structure

```
src/
├── app/              # Next.js routing
│   ├── (auth)/       # Login / signup pages
│   ├── (dashboard)/  # Dashboard UI pages
│   └── api/          # REST API route handlers
├── components/       # React components
├── lib/              # Client-side utilities
└── server/           # Server-only backend logic
    ├── ai/           # Gemini + Groq providers, prompts, rate limiting
    ├── db/           # Drizzle client + schema
    ├── signals/      # Fingerprinting, parsers (Sentry, Slack, generic)
    ├── validators/   # Zod schemas for API input
    ├── auth.ts       # Auth.js config
    └── env.ts        # Validated env vars
```

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/ticketcraft.git
cd ticketcraft
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | [neon.tech](https://neon.tech) — free PostgreSQL |
| `AUTH_SECRET` | Run `npx auth secret` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub → Settings → Developer settings → OAuth Apps |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| `UPLOADTHING_TOKEN` | [uploadthing.com](https://uploadthing.com) |

### 3. Push database schema

```bash
npx drizzle-kit push
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with GitHub, create a team, and start ingesting signals.

## API Reference

```
POST /api/signals/ingest?teamId=ID    # Ingest text signal
POST /api/tickets/generate?teamId=ID  # AI-generate ticket from signals
POST /api/webhooks/sentry             # Sentry webhook (header: x-team-id)
POST /api/webhooks/slack              # Slack webhook (header: x-team-id)
GET  /api/signals?teamId=ID           # List signals
GET  /api/tickets?teamId=ID           # List tickets
```

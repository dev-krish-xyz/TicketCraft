# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (Next.js)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint (flat config, Next.js rules)
npx drizzle-kit push     # Push schema changes to Neon DB
npx drizzle-kit generate # Generate migration files
```

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript 5
- **Tailwind CSS 4** (via @tailwindcss/postcss plugin)
- **Framer Motion** for landing page animations
- **Drizzle ORM** + **Neon PostgreSQL** (serverless, `@neondatabase/serverless`)
- **Auth.js v5** (NextAuth) with GitHub OAuth + `@auth/drizzle-adapter`
- **Google Gemini 2.0 Flash** for AI analysis (Groq as fallback)
- **Uploadthing** for screenshot file uploads
- **Zod** for runtime validation
- **ESLint 9** flat config with next/core-web-vitals and TypeScript

## Architecture

**Path alias:** `@/*` maps to `./src/*`

### Landing page

`src/app/page.tsx` (~1550 lines) — `"use client"` component tree with all sections inline. Hero features an animated SVG wire network on an 8-second loop. Dark/light theme via CSS variables in `globals.css`, stored in `localStorage` key `"ticketcraft-theme"`.

### Backend (API routes)

All API logic in `src/app/api/` using Next.js Route Handlers. Key routes:

- `auth/[...nextauth]` — Auth.js catch-all
- `teams/`, `teams/[slug]/`, `teams/[slug]/members/` — Team CRUD
- `signals/`, `signals/[id]`, `signals/ingest/` — Signal CRUD + unified ingestion
- `tickets/`, `tickets/[id]`, `tickets/generate/` — Ticket CRUD + AI generation
- `ai/analyze/`, `ai/deduplicate/` — AI analysis endpoints
- `webhooks/sentry/`, `webhooks/slack/` — External webhook receivers
- `dashboard/stats/` — Aggregated statistics
- `uploadthing/` — File upload handler

### Database

- **Connection:** Lazy-initialized via `getDb()` from `src/lib/db/index.ts` (required because build-time imports must not connect)
- **Schema files:** `src/lib/db/schema/` — `auth.ts`, `teams.ts`, `signals.ts`, `tickets.ts`, `ai.ts`, barrel `index.ts`
- **Key tables:** `users`, `teams`, `team_members`, `signals` (with fingerprint dedup), `tickets`, `signal_tickets` (M2M), `ai_analyses` (audit trail)
- **Migrations:** `src/lib/db/migrations/`, managed by `drizzle-kit`

### Auth

Configured in `src/lib/auth.ts`. Uses lazy config function `NextAuth(() => ...)` to defer DB connection. GitHub OAuth provider. Session callback injects `user.id`. Sign-in page at `/login`.

### AI system

- **Provider abstraction:** `src/lib/ai/provider.ts` — `AIProvider` interface with `analyzeSignal()` and `checkDuplicate()`
- **Implementations:** `src/lib/ai/gemini.ts` (primary), `src/lib/ai/groq.ts` (fallback)
- **Prompts:** `src/lib/ai/prompts/` — structured JSON output templates
- **Rate limiting:** `src/lib/ai/rate-limit.ts` — in-memory token bucket, auto-fallback between providers
- **Signal fingerprinting:** `src/lib/signals/fingerprint.ts` — normalize + SHA-256 for dedup

### Dashboard

- Route group `(dashboard)/dashboard/` with server-side auth guard in `layout.tsx`
- Sidebar shell: `src/components/dashboard/shell.tsx`
- Pages: overview (stats), signals (list + filter + generate ticket), tickets (list + detail + edit), settings (team management)
- Route group `(auth)/` for login/signup pages

### Environment variables

See `.env.local.example`. Required: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`. Optional: `GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`, `UPLOADTHING_TOKEN`.

### Important patterns

- All API routes use `getDb()` (not a static `db` import) to avoid build-time DB connection errors
- All API routes verify team membership before allowing access to team resources
- Webhook routes use header-based team identification (`x-team-id`) instead of session auth
- Validators in `src/lib/validators/` — shared Zod schemas for all input validation
- Signal parsers in `src/lib/signals/parsers/` — normalize payloads from Sentry, Slack, generic text

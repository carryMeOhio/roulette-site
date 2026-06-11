# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

"Галас Музична Рулетка" — a music roulette web app for a friend group. Participants anonymously submit albums each season, everyone listens and leaves scores + text reviews, highest-scored album wins the season. The site is a read-only public archive + an admin panel for data entry.

All commands below must be run from `roulette-site/`.

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npm run lint         # ESLint
npm run db:migrate   # run Prisma migrations (creates/updates prisma/dev.db)
npm run db:generate  # regenerate Prisma client after schema changes
npm run db:studio    # open Prisma Studio GUI
npm run import       # seed DB from the Excel file (../Галас музична рулетка.xlsx)
npm run covers       # batch-fetch album cover art from MusicBrainz (1 req/s rate limit)
npm run covers -- --all  # re-fetch covers for all albums, overwriting existing
```

## Environment variables

Copy `.env.example` → `.env`. Required vars:
- `DATABASE_URL` — path to SQLite file, e.g. `file:./prisma/dev.db`
- `SESSION_SECRET` — at least 32-char string for iron-session cookie encryption
- `ADMIN_PASSWORD` — plain-text password checked at `POST /api/auth/login`

## Architecture

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Prisma (SQLite) · iron-session · shadcn/ui (Radix UI)

**Route layout:**
- `app/(public)/` — public pages: home, seasons list, season detail, album detail, stats
- `app/admin/` — admin panel: login, dashboard, and CRUD pages for seasons/albums/scores/reviews/participants
- `app/api/` — REST API routes consumed by the admin pages

**Data layer (`lib/`):**
- `lib/queries.ts` — all read queries for public pages (centralize new queries here)
- `lib/prisma.ts` — singleton Prisma client
- `lib/auth.ts` — iron-session setup and `requireAdmin()` guard (call this at the top of every admin API route handler)
- `lib/score.ts` — color-coding helpers for score display
- `lib/coverart.ts` — MusicBrainz cover art lookup

**Admin authentication:** Session cookie set by `POST /api/auth/login`. API routes that mutate data call `requireAdmin()` from `lib/auth.ts`. Root-level `proxy.ts` is the Next.js 16 replacement for `middleware.ts` and IS active — it redirects unauthenticated requests to `/admin/*` pages to the login page. Session config lives in `lib/session.ts` (kept import-free so both the edge-runtime proxy and Node-runtime `lib/auth.ts` can use it).

**Data model (Prisma):** `Season → Album → Score / Review`, with `Participant` linked to scores, reviews, and submitted albums. A `Score` and `Review` are each unique per `(albumId, participantId)`.

**Components:** `components/ui/` contains shadcn/ui primitives; `components/ScoreBadge.tsx` and `components/admin/` hold domain-specific components.

**One-time data import:** `scripts/import-xlsx.ts` reads the historical Excel spreadsheet and upserts all seasons, albums, participants, and scores. `scripts/fetch-covers.ts` populates `Album.coverUrl` via MusicBrainz.

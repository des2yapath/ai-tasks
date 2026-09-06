# Tasks — AI-Powered Cross-Device Task Manager

A personal, production-ready todo app whose primary feature is **AI task generation**:
paste messy text, drop screenshots or `.md`/`.txt` files, and an AI turns it into a
structured, reviewable task list that syncs across all your devices.

**Nothing is ever auto-inserted.** Every AI generation goes through a review screen
where you edit, select, reorder, and regenerate tasks before applying them.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router) + TypeScript (strict) |
| Styling | Tailwind CSS v4 (hand-rolled primitives, no component library) |
| Database / Auth / Sync | Supabase (Postgres + Auth + Realtime, RLS on every table) |
| Hosting | Vercel Hobby (free) |
| AI | Called **directly from your browser** to Gemini or any OpenAI-compatible endpoint |

Dependencies are deliberately minimal: `@supabase/supabase-js`, `@supabase/ssr`, `clsx`.

## Core loop

```
Open app (phone or laptop)
  → paste text / upload screenshot or .md file / add instructions
  → AI analyzes → structured task preview (NEVER auto-inserted)
  → user edits/selects tasks in review screen
  → Apply to project (existing / new / Inbox)
  → synced to all devices (Supabase Realtime)
```

## Local setup

1. **Prerequisites:** Node.js 20.9+ and npm.
2. **Install:**
   ```bash
   npm install
   ```
3. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier):
   - Create a new project.
   - Open **SQL Editor** and run the entire contents of `supabase/schema.sql`.
   - Under **Authentication → Providers**, ensure Email is enabled.
   - Optional (recommended for personal use): under **Authentication → Providers → Email**,
     disable **"Confirm email"** so sign-up logs you in immediately. Both flows are supported.
   - Set **Site URL** (Authentication → URL Configuration) to `http://localhost:3000` for dev,
     and your production URL after deploying.
4. **Configure environment:** copy `.env.example` to `.env.local` and fill in your project's
   URL and `anon` key (found in Supabase → Project Settings → API).
5. **Run:**
   ```bash
   npm run dev
   ```
6. Register an account, open **Settings → AI Providers**, and add a key (below).

## Configuring AI providers

Keys live **only in your browser's localStorage** and are sent only to the provider you
choose — never to this app's server, never to Supabase, never in git.

### Google Gemini (default)

1. Get a free key at [aistudio.google.com](https://aistudio.google.com).
2. Settings → AI Providers → edit the built-in **Google Gemini** entry → paste the key.
3. Default model is `gemini-2.5-flash` (free tier, vision-capable, JSON output) — editable
   if Google renames models.

### Any OpenAI-compatible endpoint

Add a provider with a **Base URL** + model + key:

| Service | Base URL |
|---|---|
| OpenRouter | `https://openrouter.ai/api/v1` |
| Groq | `https://api.groq.com/openai/v1` |
| Together | `https://api.together.xyz/v1` |
| Ollama (local) | `http://localhost:11434/v1` |
| OpenAI | `https://api.openai.com/v1` |

`/chat/completions` is appended automatically. Tick **Vision** for models that accept
images and **JSON mode** only if the endpoint supports `response_format`.

**Ollama CORS note:** browsers are blocked by default; start Ollama with
`OLLAMA_ORIGINS=http://localhost:3000` (or `*`) so this app can call it.

### Free vs cost

- Vercel Hobby, Supabase free tier, Gemini flash free tier: **$0** for personal use.
- Only AI API usage can cost money, and only if you pick paid models. Free models
  (Gemini flash, OpenRouter free models, Ollama) work fine.
- Supabase free projects may pause after ~1 week of inactivity — log in to the
  dashboard occasionally or upgrade if that becomes a problem.

## Deployment (Vercel)

1. Push the repo to GitHub/GitLab.
2. [vercel.com/new](https://vercel.com/new) → import the repo → Next.js is auto-detected.
3. Add environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy, then set Supabase **Site URL** to your deployment URL (and add it to
   redirect allow-list).

## Architecture

- **Client-side AI:** The browser talks *directly* to Gemini or OpenAI-compatible
  endpoints. Zero server-side secret management, no serverless timeouts on long AI calls,
  and privacy-first key management.
- **Provider abstraction:** `lib/ai/provider.ts` defines `AIProvider`; `gemini.ts` and
  `openai-compatible.ts` implement it. The rest of the app never sees a wire format.
- **Structured output:** every AI response is parsed and validated (`lib/ai/schemas.ts`)
  before display; malformed JSON triggers one automatic repair retry, then a friendly error.
- **Sync:** `AppDataProvider` loads all data once per session and subscribes to Supabase
  Realtime `postgres_changes` — edits appear on every device live. RLS scopes everything
  to the owner.
- **Offline tolerance:** writes are optimistic; failures queue in localStorage and replay
  on reconnect. Online-first by design.
- **Auth:** Supabase email/password **and** magic link, password reset, cookie-based SSR
  sessions with route protection in `src/proxy.ts` (Next 16's renamed middleware).

## Security notes

- No hardcoded keys; `.env*` is gitignored (`.env.example` contains placeholders only).
- The only server-side secrets are Supabase URL + anon key — public by design, protected by RLS.
- AI keys never leave the browser (localStorage tradeoff: anyone with device/browser access
  could extract them — accepted for a personal app; encrypted vault is future work).
- Uploaded files: strict type/size checks, never persisted server-side, images sent only to
  your chosen provider. Markdown previews are escaped plain text (no raw HTML rendering).
- AI output only ever produces a *preview*; applies go through typed app functions.

## Known limitations

1. Single user; no sharing/collaboration.
2. AI keys in localStorage (extractable with device access).
3. Direct browser→AI calls: some corporate networks/CORS policies block them (Ollama needs
   `OLLAMA_ORIGINS`).
4. Offline = online-first with queued writes; no offline cold-start snapshot; last-write-wins.
5. Kanban drag is desktop-only (HTML5 DnD); touch uses the "Move to" menu.
6. Calendar has no drag-to-reschedule; due dates are all-day only.
7. Uploaded images are not persisted; history stores metadata + text only.
8. Tags are stored as a `text[]` column (not junction tables) — simpler for single-user scale.
9. Subtasks are one level deep.
10. No recurring tasks, reminders, or push notifications yet.
11. Search is client-side over loaded data (fine at personal scale of hundreds–thousands).

## Design & Architecture Highlights

- **Tags**: Stored directly as a native array (`tasks.tags text[]`) for clean queries and low-latency realtime syncing without unnecessary junction tables.
- **Client Key Vault**: Provider settings and API keys reside exclusively in the client's `localStorage` rather than the database.
- **Transient Attachments**: Images and documents are parsed ephemerally in-memory during extraction, storing only lightweight metadata in `ai_generations.attachments` to prevent unnecessary storage costs.

## Future roadmap

- Natural-language task editing via a validated AI action layer ("move unfinished
  tasks to next week") with review + undo.
- Server-side encrypted key vault; Supabase Storage attachment persistence.
- Touch drag-and-drop (dnd-kit); calendar drag-rescheduling; date+time due dates.
- Recurring tasks, reminders, web push; normalized tags with a tag manager.
- Export/import (JSON/Markdown), read-only share links.

## Development

```bash
npm run dev     # dev server
npm run lint    # ESLint
npm run build   # production build (typecheck gate)
```

To regenerate PWA icons: `powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1`.

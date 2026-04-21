# DraftEdge — Build Checklist
**Draft: April 24–26, 2026 | Target: localhost ready by Thu 8pm**

---

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Complete

---

## Day 1 (Mon Apr 21) — Scaffold + Infrastructure ✅

### Project Setup
- [x] Scaffold Vite + React + TypeScript
- [x] Configure Tailwind CSS v4
- [x] Install shadcn/ui dependencies (Radix UI, clsx, tailwind-merge, lucide-react)
- [x] Install Zustand, TanStack React Query
- [x] Install Supabase JS client
- [x] `.env.example` created — user must copy to `.env` and fill in values
- [x] Configure Supabase client (`src/lib/supabase.ts`)
- [x] TypeScript path aliases configured (`@/`)

### Database
- [x] `players` table — migration `001_initial_schema.sql`
- [x] `draft_picks` table — all P&L + outcome fields per TRD spec
- [x] Indexes on `pick_number`, `bot_guess_correct`, `auto_bet_outcome`
- [ ] **USER ACTION: Run migration in Supabase SQL editor**

### Supabase Edge Functions
- [x] `kalshi-proxy` Edge Function written
- [x] `ai-pick-analysis` Edge Function written
- [ ] **USER ACTION: Deploy edge functions** (`supabase functions deploy`)
- [ ] **USER ACTION: Confirm `run-draft-bets` is deployed (TRD says already built)**

---

## Day 2 (Tue Apr 22) — COMPASS Engine + Live Board ✅

### COMPASS Algorithm (`src/lib/compass.ts`)
- [x] S1 — Scout Grade (buzz_grade / 100, weight 20%)
- [x] S2 — Consensus Board Rank (normalized 0–1, weight 18%)
- [x] S3 — Mock Draft Alignment (rank distance from slot consensus, weight 18%)
- [x] S4 — Position Premium (hard-coded hierarchy, weight 12%)
- [x] S5 — Team Need Score (need_rank × position_premium, weight 15%)
- [x] S6 — Kalshi Current Odds (live price 0–1, weight 12%)
- [x] S7 — 7-Day Kalshi Trend (7-day avg, weight 5%)
- [x] COMPASS composite calculation (weighted sum × 100)
- [x] Edge vs market calculation
- [x] Bet signal: BET_YES / BET_NO / PASS (±10pt threshold)
- [x] Confidence score: HIGH / MEDIUM / LOW
- [x] Suggested bet sizing function ($0–$100)
- [x] Bot's Guess (top COMPASS player, always populated)

### Two-Phase Timing Engine
- [x] `PickPhase` Zustand store (`src/stores/draftStore.ts`)
- [x] Phase 1 logic: poll #1 → COMPASS, no Claude (`src/hooks/useKalshiPolling.ts`)
- [x] Phase 2 logic: poll #3 → Claude call + auto-bet (`src/hooks/usePhaseEngine.ts`)
- [x] Edge re-trigger: >8pt drift after Phase 2
- [x] Missed window detection

### Live Odds Polling
- [x] React Query polling every 60s via kalshi-proxy
- [x] 7-day price history fetch
- [x] Cell flash animation (CSS + React state)

---

## Day 3 (Wed Apr 23) — Scraping + AI Edge Function ✅

### Pre-Draft Scraping Scripts
- [x] `scripts/scrape_big_board.ts` — nfldraftbuzz.com
- [x] `scripts/scrape_consensus.ts` — nflmockdraftdatabase.com
- [x] `scripts/seed_players.ts` — upserts to Supabase
- [ ] **USER ACTION: Run `npm run predraft` morning of Apr 24**

### Team Needs
- [x] `scripts/seed_team_needs.ts` — Claude haiku batch call, writes `public/team_needs.json`
- [ ] **USER ACTION: Run `npm run seed-needs` after `.env` is configured**

### AI Edge Function
- [x] `ai-pick-analysis` — COMPASS payload → claude-haiku-4-5 → rationale + recommendation
- [x] Exact TRD JSON payload format implemented
- [x] Markdown fence stripping (robust JSON parse)

---

## Day 4 (Thu Apr 24 AM) — UI Components ✅

### Frontend Components
- [x] **PickHeader** — team logo (ESPN CDN), pick #, round, phase indicator
- [x] **TeamNeedsPanel** — top 5 needs, heat-map shading, position premium inline
- [x] **OddsBoard** — all players >1% Kalshi, COMPASS sorted, flash animation, taken players grayed
- [x] **AIRecommendationCard** — bot guess, bet call, edge, confidence, suggested bet, rationale, signal bars
- [x] **MarkPickModal** — player dropdown, DB write, advance to next pick
- [x] **HistoryDrawer** — timeline cards, P&L summary, filters (all/bet/hit/miss)
- [x] **App.tsx** — full layout, nav bar, draft complete screen

### Integration
- [x] `useStartupData` — loads players + picks from Supabase, team_needs.json, mock_data.json
- [x] `NFL_DRAFT_ORDER` — all 32 Round 1 picks hardcoded
- [ ] **Pending: End-to-end test with real credentials + Kalshi data**

---

## Pre-Go-Live Checklist (Thu Apr 24 AM)
- [ ] Copy `.env.example` to `.env`, fill in all 5 credentials
- [ ] Run migration in Supabase SQL editor
- [ ] Deploy Edge Functions: `supabase functions deploy kalshi-proxy ai-pick-analysis`
- [ ] Set Edge Function secrets: `supabase secrets set KALSHI_API_KEY=... ANTHROPIC_API_KEY=...`
- [ ] Run `npm run seed-needs` (team needs → public/team_needs.json)
- [ ] Run `npm run predraft` (scrape + seed players)
- [ ] `npm run dev` — verify app loads at localhost:5173
- [ ] Verify Kalshi odds load for pick #1
- [ ] Test Mark Pick Made flow end-to-end
- [ ] Confirm `run-draft-bets` edge function is live

---

## Go Live
- [ ] 🏈 Thu Apr 24, ~8pm ET

---

## Post-Draft
- [ ] Mark all picks + outcomes recorded
- [ ] Run P&L summary SQL (see TRD Section 4)
- [ ] Review bot accuracy %

---

## Credentials Needed From User ⚠️
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `KALSHI_API_KEY`
- [ ] Confirm: `run-draft-bets` Edge Function deployed?
- [ ] Confirm: existing Supabase project or create new?

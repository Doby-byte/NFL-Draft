# DraftEdge — Build Checklist
**Draft: April 24–26, 2026 | Target: localhost ready by Thu 8pm**

---

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Complete

---

## Day 1 (Mon Apr 21) — Scaffold + Infrastructure

### Project Setup
- [ ] Scaffold Vite + React + TypeScript
- [ ] Configure Tailwind CSS
- [ ] Install shadcn/ui
- [ ] Install Zustand, TanStack React Query
- [ ] Install Supabase JS client
- [ ] Set up `.env` file (Supabase URL, anon key, Anthropic key, Kalshi key)
- [ ] Configure Supabase client

### Database
- [ ] Create `players` table
- [ ] Create `draft_picks` table (with all P&L + outcome fields)
- [ ] Create indexes on `pick_number`, `bot_guess_correct`, `auto_bet_outcome`

### Supabase Edge Functions
- [ ] `kalshi-proxy` — CORS proxy, keeps Kalshi API key server-side
- [ ] Verify `run-draft-bets` is deployed (TRD says already built)

---

## Day 2 (Tue Apr 22) — COMPASS Engine + Live Board

### COMPASS Algorithm (TypeScript, runs in browser)
- [ ] S1 — Scout Grade (buzz_grade / 100, weight 20%)
- [ ] S2 — Consensus Board Rank (normalized 0–1, weight 18%)
- [ ] S3 — Mock Draft Alignment (rank distance from slot consensus, weight 18%)
- [ ] S4 — Position Premium (hard-coded hierarchy, weight 12%)
- [ ] S5 — Team Need Score (need_rank × position_premium, weight 15%)
- [ ] S6 — Kalshi Current Odds (live price 0–1, weight 12%)
- [ ] S7 — 7-Day Kalshi Trend (7-day avg, weight 5%)
- [ ] COMPASS composite calculation (weighted sum × 100)
- [ ] Edge vs market calculation (`compass/100 - kalshi_price`)
- [ ] Bet signal: BET_YES / BET_NO / PASS (threshold: ±10 pts)
- [ ] Confidence score: HIGH / MEDIUM / LOW
- [ ] Suggested bet sizing function ($0–$100)
- [ ] Bot's Guess (top COMPASS player, always populated)

### Two-Phase Timing Engine (Zustand)
- [ ] `PickPhase` store: pickNumber, activatedAt, pollCount, phase, claudeFired, reTriggered
- [ ] Phase 1 logic: on poll #1 → run COMPASS, display prelim, no Claude
- [ ] Phase 2 logic: on poll #3 → call `ai-pick-analysis`, display recommendation, fire auto-bet if edge ≥ 10pts
- [ ] Edge re-trigger: if odds drift >8pts after Phase 2, call Claude again (max 1 re-trigger)
- [ ] Missed window detection: pick resolved before poll #3 → `missed_window = true`

### Live Odds Polling
- [ ] React Query polling every 60s via `kalshi-proxy`
- [ ] 7-day price history fetch at startup
- [ ] Cell flash animation on price change >2 points

---

## Day 3 (Wed Apr 23) — Data Scraping + AI Edge Function

### Pre-Draft Scraping Scripts
- [ ] `scripts/scrape_big_board.ts` — nfldraftbuzz.com (scout grades, measurables, position rank)
- [ ] `scripts/scrape_consensus.ts` — nflmockdraftdatabase.com (157-board aggregate rank + 1217-mock consensus)
- [ ] `scripts/seed_players.ts` — write scraped data to Supabase `players` table
- [ ] Test scrape scripts end-to-end, verify data quality

### Team Needs
- [ ] One-time Claude batch call at app startup → seed `team_needs.json` for all 32 teams
- [ ] Verify team needs data matches expected format for S5 calculation

### AI Edge Function
- [ ] `ai-pick-analysis` Edge Function
  - [ ] Accept COMPASS payload (pick, team, team_needs, top_player with all S1–S7)
  - [ ] Call `claude-haiku-4-5` with structured JSON prompt
  - [ ] Return: rationale, sentiment_score, final_recommendation, confidence
  - [ ] Max 2 Claude calls per pick enforced server-side

---

## Day 4 (Thu Apr 24 AM) — UI Components + Integration

### Frontend Components
- [ ] **Live Pick Header** — team name, city, logo (ESPN CDN), pick #, round, phase indicator
- [ ] **Team Needs Panel** — top 5 positional needs, heat-map shading (red/orange/yellow), position premium inline
- [ ] **Live Odds Board**
  - [ ] All players with Kalshi YES odds >1%
  - [ ] Columns: Player | Pos | Scout Grade | Board Rank | Mock Rank | Kalshi Now | 7-Day Avg | $1 Payout | COMPASS Score
  - [ ] Sorted by COMPASS score descending
  - [ ] Taken players struck through and grayed
  - [ ] Price flash animation
- [ ] **AI Recommendation Card**
  - [ ] Bot's Guess (always shown)
  - [ ] Bet Call: BET YES / BET NO / PASS
  - [ ] Edge (shown only if ≥10pts)
  - [ ] Confidence: HIGH / MEDIUM / LOW
  - [ ] Suggested Bet ($XX, large type; $0 on PASS)
  - [ ] Auto-Bet Status line
  - [ ] Claude rationale (3–4 sentences)
  - [ ] Signal breakdown mini bar chart (S1–S7)
- [ ] **Mark Pick Made Modal** — dropdown of available players, confirm button
  - [ ] Writes `player_picked`, `outcome`, P&L fields to DB
  - [ ] Strikes through taken player on board
  - [ ] Advances to next pick slot
- [ ] **Historical View Slide-out Panel**
  - [ ] Timeline cards: pick #, team logo, bot guess, actual pick, bet Y/N, suggested amt, outcome, P&L
  - [ ] Summary row: total auto P&L, suggested P&L, hit rate
  - [ ] Filters: round / outcome / team / bet placed

### Integration + Testing
- [ ] Full end-to-end test with mock data
- [ ] Verify auto-bet fires correctly ($1, edge ≥ 10pts only)
- [ ] Verify Claude call count per pick (max 2)
- [ ] Verify P&L recording in DB

---

## Pre-Go-Live (Thu Apr 24, early afternoon)
- [ ] Run `scrape_big_board.ts` for fresh data
- [ ] Run `scrape_consensus.ts` for fresh data
- [ ] Run `seed_players.ts` to populate Supabase
- [ ] Kalshi API connection verified (live odds loading)
- [ ] All 32 team needs seeded
- [ ] Test full Phase 1 → Phase 2 → auto-bet flow
- [ ] Verify DB writes for a mock pick

---

## Go Live
- [ ] 🏈 Thu Apr 24, ~8pm ET — Draft begins

---

## Post-Draft
- [ ] Mark all picks made / outcomes recorded
- [ ] Run P&L summary SQL query
- [ ] Run per-pick breakdown query
- [ ] Review bot accuracy %

---

## Credentials Needed From User
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (for Edge Functions)
- [ ] `ANTHROPIC_API_KEY`
- [ ] `KALSHI_API_KEY`
- [ ] Confirm: is `run-draft-bets` Edge Function already deployed on Supabase?
- [ ] Confirm: which Supabase project to use (existing or create new)?

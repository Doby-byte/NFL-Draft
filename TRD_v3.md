# TRD — NFL Draft Intelligence Dashboard ("DraftEdge")
**Version:** 3.0 | **Author:** br0.ai | **Date:** April 2026

---

## 1. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite (localhost) | No deploy needed, instant dev server |
| Styling | Tailwind CSS + shadcn/ui | Fast, polished, zero design cost |
| State | Zustand | Lightweight, no boilerplate |
| Data fetching | TanStack React Query | Polling, caching, phase trigger logic |
| Backend | Supabase Edge Functions | Already in stack, free tier |
| Database | Supabase Postgres | Full pick + P&L history |
| Scheduling | pg_cron (already built) | Autonomous $1 Kalshi bet execution |
| AI | claude-haiku-4-5 | Cheapest model, synthesis + sentiment only |
| Kalshi data | Kalshi REST API v2 | Via CORS proxy Edge Function |
| Player data | nfldraftbuzz.com + nflmockdraftdatabase.com | Free scrape, pre-draft |
| NFL logos | ESPN CDN | Free, no auth required |

---

## 2. The COMPASS Algorithm

### 2.1 Overview

COMPASS is a deterministic scoring model that runs entirely in the browser using pre-scraped static data. It produces a composite score (0–100) for every available player relative to a specific pick slot and team. Claude does **not** run COMPASS — the browser runs it in Phase 1 at zero API cost. Claude only receives the output and adds sentiment context in Phase 2.

**COMPASS** = **C**onsensus rank + **O**dds signal + **M**ock draft alignment + **P**osition premium + **A**vailability gap + **S**entiment + **S**cout grade

---

### 2.2 The 7 Signals

Each signal normalized to 0.0–1.0 before weighting.

#### S1 — Scout Grade | Weight: 20%
```
Source: nfldraftbuzz.com "All Scouts Average" grade (0–100)
S1 = player.buzz_grade / 100
// Caleb Downs 92.0 → S1 = 0.920
```

#### S2 — Consensus Board Rank | Weight: 18%
```
Source: nflmockdraftdatabase.com (157 boards aggregated)
S2 = 1 - ((player.consensus_rank - 1) / 99)
// Rank 1 → 1.0 | Rank 50 → 0.505 | Rank 100+ → 0.0
```

#### S3 — Mock Draft Alignment | Weight: 18%
```
Source: nflmockdraftdatabase.com consensus mock (1,217 mocks)
consensus_rank_for_slot = mock_data[pick_number].consensus_rank
rank_distance = abs(player.consensus_rank - consensus_rank_for_slot)
S3 = max(0, 1 - (rank_distance / 20))
// Consensus pick = 1.0 | 10 ranks away = 0.50 | 20+ = 0.0
```

#### S4 — Position Premium | Weight: 12%
```
Source: Hard-coded universal hierarchy
POSITION_PREMIUM = {
  QB: 1.00, OT: 0.85, EDGE: 0.80, CB: 0.72, WR: 0.65,
  DT: 0.60, TE: 0.55, LB: 0.52, S: 0.48,
  IOL: 0.42, RB: 0.32, FB: 0.10, K: 0.05, P: 0.05
}
S4 = POSITION_PREMIUM[player.position]
```

#### S5 — Team Need Score | Weight: 15%
```
Source: team_needs.json × POSITION_PREMIUM
need_rank   = team_needs[team][player.position]  // 1=top need, 5=minor, 0=none
base_need   = { 1:1.0, 2:0.8, 3:0.6, 4:0.4, 5:0.2, 0:0.0 }[need_rank]
S5          = base_need * POSITION_PREMIUM[player.position]
// #1 need at QB  = 1.0 * 1.00 = 1.00
// #3 need at RB  = 0.6 * 0.32 = 0.19
```

#### S6 — Kalshi Current Odds | Weight: 12%
```
Source: Kalshi REST API (live, polled every 60s)
S6 = player.kalshi_yes_price  // 0.0–1.0 direct
// Included because crowd signal is real — but we're trying to beat it
```

#### S7 — 7-Day Kalshi Trend | Weight: 5%
```
Source: Kalshi price history endpoint
S7 = player.kalshi_7day_avg
momentum = player.kalshi_yes_price - player.kalshi_7day_avg
// Rising = positive momentum, used in rationale framing
```

---

### 2.3 COMPASS Composite

```typescript
const COMPASS = (
  S1 * 0.20 +
  S2 * 0.18 +
  S3 * 0.18 +
  S4 * 0.12 +
  S5 * 0.15 +
  S6 * 0.12 +
  S7 * 0.05
) * 100;
// Result: 0–100
```

---

### 2.4 Bet Signal & Edge Calculation

```typescript
const top     = players.sortBy('COMPASS')[0];
const edge    = (top.COMPASS / 100) - top.kalshi_yes_price;
// e.g. COMPASS 0.76 - Kalshi 0.62 = edge 0.14 (14 points)

// Bet only fires if edge clears the 10-point threshold
const betCall = edge >= 0.10  ? 'BET_YES'
              : edge <= -0.10 ? 'BET_NO'
              : 'PASS';

// PASS = no auto-bet. The bot still makes a guess.
```

The 10-point threshold exists to filter noise from genuine edge. Markets that are fairly priced (within 10 points of COMPASS) offer no exploitable gap. Frequent passes are correct behavior, not a failure.

---

### 2.5 Confidence Score

```typescript
const confidence =
  edge > 0.18 && top.S1 > 0.85 && top.S3 > 0.80 ? 'HIGH'  :
  edge > 0.10                                     ? 'MEDIUM':
                                                    'LOW';
```

---

### 2.6 Suggested Bet Sizing

Applied only when `betCall !== 'PASS'` and `confidence !== 'LOW'`.

```typescript
function suggestedBet(edge: number, confidence: string): number {
  if (confidence === 'LOW' || edge < 0.10) return 0;

  // Base range by edge bucket
  const [lo, hi] =
    edge >= 0.20 ? [60, 100] :
    edge >= 0.15 ? [25,  60] :
                   [ 5,  25];

  // Scale linearly within range by confidence
  const multiplier = confidence === 'HIGH' ? 1.0 : 0.6;
  const raw = lo + (hi - lo) * ((edge - 0.10) / 0.10) * multiplier;

  // Round to nearest $5
  return Math.round(Math.min(100, Math.max(1, raw)) / 5) * 5;
}

// Examples:
// edge=0.14, MEDIUM → $10
// edge=0.14, HIGH   → $20
// edge=0.18, HIGH   → $45
// edge=0.22, HIGH   → $75
```

The $1 auto-bet fires independently of this value. `suggested_bet` is display-only and recorded for post-draft analysis.

---

### 2.7 Bot's Guess

The bot always names its top COMPASS player as the predicted pick, even on PASS picks. This is recorded as `bot_guess` in the DB. It is the bot's best prediction of who will actually be selected, separate from whether a bet is warranted.

```typescript
const botGuess = players.sortBy('COMPASS')[0].name;
// Always populated. Always displayed. Always recorded.
```

---

### 2.8 Two-Phase Timing Engine

```typescript
// Zustand store tracks phase per pick
interface PickPhase {
  pickNumber:   number;
  activatedAt:  Date;
  pollCount:    number;       // increments every 60s
  phase:        1 | 2 | 'closed';
  claudeFired:  boolean;
  reTriggered:  boolean;
  oddsAtPhase1: number;
  oddsAtPhase2: number | null;
}

// React Query polls every 60s
// On each poll:
onKalshiPoll(newOdds) {
  state.pollCount++;

  if (state.pollCount === 1) {
    // Phase 1: run COMPASS, display preliminary scores, NO Claude call
    runCOMPASS(newOdds);
    setPhase(1);
    setOddsAtPhase1(newOdds.topPlayer.price);
  }

  if (state.pollCount === 3 && !state.claudeFired) {
    // Phase 2: fire Claude, display full recommendation, fire auto-bet if edge
    const analysis = await callAIPickAnalysis(compassScores);
    setPhase(2);
    setOddsAtPhase2(newOdds.topPlayer.price);
    state.claudeFired = true;

    if (analysis.betCall !== 'PASS') {
      await fireAutoBet(ticker, 1.00);  // always exactly $1
    }
  }

  if (state.claudeFired && !state.reTriggered) {
    const drift = abs(newOdds.topPlayer.price - state.oddsAtPhase2);
    if (drift > 0.08) {
      // Edge re-trigger: odds shifted >8pts after Phase 2
      const refreshed = await callAIPickAnalysis(compassScores);
      state.reTriggered = true;
      // Update recommendation display — do NOT fire a second auto-bet
    }
  }
}
```

**Maximum 2 Claude calls per pick under any circumstances.**
If the pick resolves before poll #3, `missed_window = true` is written to the DB. No bet, no Claude call.

---

## 3. Database Schema

```sql
-- ============================================================
-- PLAYERS: seeded pre-draft, updated as picks are made
-- ============================================================
create table players (
  id              serial primary key,
  name            text not null,
  position        text not null,
  school          text,
  buzz_grade      float,       -- nfldraftbuzz.com 0–100
  consensus_rank  int,         -- nflmockdraftdatabase.com aggregated rank
  taken           boolean default false,
  taken_at_pick   int,
  taken_by_team   text,
  created_at      timestamptz default now()
);

-- ============================================================
-- DRAFT_PICKS: one row per pick slot, core record
-- ============================================================
create table draft_picks (
  id                    serial primary key,
  pick_number           int not null,
  round                 int not null,
  team                  text not null,

  -- Bot output
  bot_guess             text not null,        -- bot's predicted pick (always set)
  bot_guess_confidence  text not null,        -- HIGH / MEDIUM / LOW
  ai_rationale          text,                 -- Claude's 3-sentence rationale (null if missed_window)
  compass_score         float,               -- top player's COMPASS at Phase 2
  edge_vs_market        float,               -- COMPASS implied prob - kalshi price
  bet_call              text not null,        -- BET_YES / BET_NO / PASS

  -- Bet execution
  auto_bet_placed       boolean default false,
  auto_bet_amount       float default 0,      -- always 1.00 or 0
  auto_bet_side         text,                 -- 'yes' | 'no' | null
  suggested_bet_amount  float default 0,      -- $0–$100 display recommendation
  missed_window         boolean default false,-- pick resolved before Phase 2

  -- Kalshi odds at key moments
  odds_at_phase1        float,               -- price when first seen
  odds_at_phase2        float,               -- price when bet fired
  odds_drift            float,               -- phase2 - phase1

  -- Outcome (filled in when pick is marked)
  player_picked         text,                -- actual player selected
  bot_guess_correct     boolean,             -- did bot_guess match player_picked?
  auto_bet_outcome      text,               -- 'hit' | 'miss' | 'pending' | 'no_bet'
  auto_bet_payout       float,              -- actual $1 payout if hit (e.g. $1.63)
  auto_bet_profit       float,              -- payout - 1.00 (positive = profit)

  -- Hypothetical P&L at suggested bet size
  suggested_bet_outcome text,               -- 'hit' | 'miss' | 'no_bet'
  suggested_bet_payout  float,              -- suggested_amount * (1/odds) if hit
  suggested_bet_profit  float,              -- payout - suggested_amount (negative if miss)

  -- Full state snapshot for post-draft audit
  signal_snapshot       jsonb,              -- all S1–S7 values for every player at Phase 2
  all_player_scores     jsonb,              -- full COMPASS board at pick time

  created_at            timestamptz default now(),
  resolved_at           timestamptz
);

-- Index for fast history queries
create index on draft_picks (pick_number);
create index on draft_picks (bot_guess_correct);
create index on draft_picks (auto_bet_outcome);
```

---

## 4. Post-Draft P&L Analysis Query

Run this in Supabase SQL editor after the draft to see full results:

```sql
SELECT
  -- Auto-bet results ($1 per qualifying pick)
  COUNT(*) FILTER (WHERE auto_bet_placed)                          AS auto_bets_placed,
  COUNT(*) FILTER (WHERE auto_bet_outcome = 'hit')                 AS auto_bets_hit,
  ROUND(SUM(COALESCE(auto_bet_profit, 0))::numeric, 2)             AS auto_total_profit,

  -- Suggested bet hypothetical results
  COUNT(*) FILTER (WHERE suggested_bet_amount > 0)                 AS suggested_bets_shown,
  COUNT(*) FILTER (WHERE suggested_bet_outcome = 'hit')            AS suggested_bets_hit,
  ROUND(SUM(COALESCE(suggested_bet_profit, 0))::numeric, 2)        AS suggested_total_profit,

  -- Bot guess accuracy
  COUNT(*) FILTER (WHERE bot_guess_correct)                        AS bot_guesses_correct,
  COUNT(*) FILTER (WHERE player_picked IS NOT NULL)                AS picks_resolved,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE bot_guess_correct)
    / NULLIF(COUNT(*) FILTER (WHERE player_picked IS NOT NULL), 0),
    1
  )                                                                AS bot_accuracy_pct,

  -- Missed windows (pick resolved before Phase 2)
  COUNT(*) FILTER (WHERE missed_window)                            AS missed_windows

FROM draft_picks;
```

Per-pick breakdown:
```sql
SELECT
  pick_number,
  team,
  bot_guess,
  player_picked,
  bot_guess_correct,
  bet_call,
  edge_vs_market,
  auto_bet_placed,
  auto_bet_profit,
  suggested_bet_amount,
  suggested_bet_profit
FROM draft_picks
ORDER BY pick_number;
```

---

## 5. Claude Payload (Phase 2)

```json
{
  "pick": 3,
  "team": "NYG",
  "team_needs": ["EDGE", "OT", "CB"],
  "top_player": {
    "name": "Arvell Reese",
    "position": "LB",
    "compass": 79.4,
    "edge_vs_market": 0.14,
    "bet_call": "BET_YES",
    "confidence": "HIGH",
    "suggested_bet": 25,
    "s1_scout_grade": 0.88,
    "s2_board_rank": 0.84,
    "s3_mock_alignment": 0.91,
    "s4_position_premium": 0.52,
    "s5_team_need": 0.72,
    "s6_kalshi_now": 0.62,
    "s7_7day_avg": 0.58,
    "momentum": 0.04
  },
  "instruction": "Search for any breaking news, insider reports, or beat reporter signals about pick #3 and the NYG in the last 24 hours. Then write a 3-sentence rationale for this recommendation. Be direct and specific. Return only valid JSON, no markdown."
}
```

Claude response (~300 tokens):
```json
{
  "sentiment_summary": "Multiple insiders citing NYG staff interest in Reese...",
  "rationale": "Three direct sentences explaining the recommendation.",
  "sentiment_score": 0.74,
  "final_recommendation": "BET_YES",
  "confidence": "HIGH"
}
```

---

## 6. Edge Functions

### `kalshi-proxy`
CORS proxy. Keeps API key server-side.
```
GET /functions/v1/kalshi-proxy?path=/markets?series_ticker=KXNFLDRAFT
```

### `ai-pick-analysis`
Receives COMPASS payload, calls Claude haiku, returns recommendation.
```
POST /functions/v1/ai-pick-analysis
Body: { pick, team, team_needs, top_player }
Returns: { rationale, sentiment_score, final_recommendation, confidence, suggested_bet }
```

### `run-draft-bets` (already built)
Fires $1 auto-bet when called by the frontend Phase 2 trigger.
No changes needed.

---

## 7. Pre-Draft Scraping Scripts

Run morning of April 24 (Thursday):

```bash
npx ts-node scripts/scrape_big_board.ts      # nfldraftbuzz.com grades
npx ts-node scripts/scrape_consensus.ts       # nflmockdraftdatabase.com board + mock
npx ts-node scripts/seed_players.ts           # write players table to Supabase
```

Team needs are seeded via one-time Claude batch call at app startup (32 teams × ~200 tokens = ~$0.10 total).

---

## 8. Build Order

| Day | Task |
|---|---|
| Mon | Scaffold Vite + React, Supabase client, kalshi-proxy Edge Function |
| Tue | COMPASS engine (TypeScript), OddsBoard component, Kalshi live polling |
| Wed AM | Scraping scripts + seed data, players table |
| Wed PM | ai-pick-analysis Edge Function, two-phase timing engine in Zustand |
| Thu AM | AIRecommendation card (guess + bet + suggested + rationale), TeamNeedsPanel, HistoryDrawer with P&L, MarkPickModal |
| Thu 8pm | 🏈 Go live |

---

## 9. Projected Cost

| Item | Cost |
|---|---|
| Supabase Free Tier | $0 |
| Kalshi API | $0 |
| Claude haiku — 32 Phase 2 calls (~700 tokens each) | ~$1.28 |
| Claude haiku — ~5 edge re-trigger calls | ~$0.20 |
| Claude haiku — team needs seed (one-time) | ~$0.10 |
| All data sources (nfldraftbuzz, nflmockdraftdatabase, drafttek) | $0 |
| Hosting (localhost) | $0 |
| **Total** | **~$1.60** |

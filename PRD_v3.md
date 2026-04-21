# PRD — NFL Draft Intelligence Dashboard ("DraftEdge")
**Version:** 3.0 | **Author:** br0.ai | **Date:** April 2026

---

## 1. Overview

DraftEdge is a locally-run Mac web application that serves as a real-time, AI-powered NFL Draft betting command center. It monitors Kalshi prediction markets pick-by-pick, runs an autonomous multi-signal intelligence algorithm entirely in-browser using pre-scraped data, and calls Claude only once per pick for a final sentiment sweep and rationale. The result is a clear recommendation with confidence score and suggested bet size for every selection — and a full post-draft analysis database — at near-zero API cost.

The primary user is a single operator running the app on localhost during the 2026 NFL Draft (April 24–26).

---

## 2. Goals

- Surface actionable Kalshi betting edges before each pick resolves
- Do all heavy computational work client-side using pre-scraped static data — Claude is used sparingly, only for the final synthesis step
- Always make a recommendation and a guess — even when the bot does not bet
- Auto-bet exactly $1 per pick when edge is confirmed; display a suggested manual bet of $1–$100 separately
- Record everything to the DB so a full P&L analysis can be run after the draft
- Total API cost: under $3 for the entire draft

---

## 3. Cost Philosophy

The algorithm runs 90% on pre-scraped static data loaded into the browser. Claude is called **once per pick** and only receives a small, structured JSON payload — not raw text or articles. Claude's job is narrow: read 7 pre-computed scores, do a quick web sentiment search, and write a rationale. It does not research, grade players, or analyze team needs — that work is already done before the draft starts.

**Projected Claude cost:**
- 32 picks × 1 call each (Phase 2 only)
- Input: ~400 tokens (structured JSON)
- Output: ~300 tokens (rationale + recommendation)
- Model: claude-haiku-4-5 (cheapest, fast, sufficient for synthesis)
- Edge re-trigger calls (3–5 expected): ~$0.20 extra
- Estimated total: **$1.40–$2.00 for the entire draft**

---

## 4. Non-Goals

- No PFF — all player data from free sources only
- Not a mobile app
- Not multi-user
- Not connected to Polymarket (v1)
- Does not require Claude to do research — all signals pre-computed

---

## 5. The No-Bet Rule

**The bot only places the $1 auto-bet when COMPASS identifies an edge of 10 or more percentage points over the Kalshi market price.** If no edge exists, the bot places no bet.

This is intentional and correct behavior. The Kalshi market price already reflects thousands of bettors' collective intelligence. If COMPASS agrees with the market within 10 points, there is no exploitable gap — betting into a fairly-priced market just burns money.

**However, the bot always makes a recommendation and a guess regardless of whether it bets.** Every pick gets:
- A top player prediction (the bot's best guess at who will actually be picked)
- A bet recommendation (BET YES / BET NO / PASS)
- A suggested manual bet amount ($0 if PASS, $1–$100 if there is edge)
- A confidence score (HIGH / MEDIUM / LOW)
- A written rationale

On a typical 32-pick Round 1, the bot is expected to bet on 8–12 picks and pass on the remaining 20+. Frequent passes are a sign the algorithm is working correctly. The high-consensus early picks (e.g. Fernando Mendoza at 99% for pick #1) will almost never trigger a bet because the market is already efficiently priced. Edge opportunities live in the messy middle — picks 10–25 where uncertainty is real and the crowd is split.

---

## 6. Bet Architecture

### 6.1 Auto-Bet (Autonomous)
- Amount: always exactly **$1.00**, no exceptions
- Fires: only at Phase 2 (see Section 8 — Timing) when edge ≥ 10 points
- Executed by: `run-draft-bets` Supabase Edge Function via Kalshi API
- Recorded in DB as: `auto_bet_placed = true`, `auto_bet_amount = 1.00`

### 6.2 Suggested Manual Bet (Display Only)
Displayed prominently on the AI Recommendation Card. Advisory only — the user decides whether to act on it manually.

| Edge | Confidence | Suggested Bet |
|---|---|---|
| < 10pts | Any | $0 — PASS, no bet |
| 10–14pts | MEDIUM | $5–15 |
| 10–14pts | HIGH | $15–25 |
| 15–19pts | MEDIUM | $25–40 |
| 15–19pts | HIGH | $40–60 |
| 20pts+ | HIGH | $60–100 |
| Any | LOW | $0 — do not bet |

The exact suggested amount within each range is scaled linearly by the edge value. A 12-point MEDIUM edge → ~$10. A 13-point HIGH edge → ~$20.

### 6.3 The Bot's Guess
Even on PASS picks, the bot names its best prediction for who will actually be selected. This is distinct from the bet recommendation — it is purely a pick prediction. Displayed as **"Bot's Guess: [Player Name]"** with a confidence label. Recorded in DB regardless of whether a bet fires.

---

## 7. User Stories

| # | As a user I want to... | So that... |
|---|---|---|
| U1 | See which team is on the clock with their logo | I immediately know the context |
| U2 | See that team's top positional needs, shaded red by position premium | I understand what they're likely to do |
| U3 | See all players >1% Kalshi odds with current price, 7-day avg, payout | I can evaluate every candidate |
| U4 | See the COMPASS score for each player on the board | I see the full ranked picture |
| U5 | See the bot's top bet pick, confidence, rationale, and suggested bet amount | I have a clear recommendation to act on |
| U6 | See the bot's pick guess even on PASS picks | I always know what the bot thinks will happen |
| U7 | Mark a pick as made and remove that player from the board | The board stays current during the draft |
| U8 | Review any past pick — the recommendation, bet, outcome, P&L | I can audit every decision post-draft |
| U9 | Run a post-draft P&L analysis on suggested vs actual bets | I know how much I would have made or lost |
| U10 | Dashboard auto-refreshes odds without manual reload | I don't miss market moves |

---

## 8. Timing — Two-Phase Analysis

NFL teams have 10 minutes on the clock in Round 1. The bot uses a two-phase approach to balance speed against signal quality.

### Phase 1 — Immediate (Poll 1, ~60 seconds after new pick activates)
- COMPASS runs instantly using all pre-scraped static data + current Kalshi odds
- Preliminary scores displayed on the board immediately
- **No Claude call. No bet.**
- Purpose: surface the picture fast, let the user see the landscape

### Phase 2 — Committed (Poll 3, ~3 minutes after pick activates)
- Claude fires its single analysis call
- By this point Kalshi odds have had 3 minutes to settle from initial market reaction
- Any immediate breaking news has had time to surface
- If COMPASS still shows ≥10 point edge after market stabilization → **auto-bet fires + full recommendation displayed**
- If the pick resolves before Phase 2 fires → logged as `missed_window = true`, no bet placed

### Edge Re-Trigger (exceptional)
If odds shift more than 8 points between Phase 2 and pick resolution, a second Claude call fires to check whether the recommendation has flipped. Expected on 3–5 picks per draft night. Budget ~$0.20–0.40 extra for these.

**Rule: maximum 2 Claude calls per pick under any circumstances.**

---

## 9. Feature Requirements

### 9.1 Live Pick Header
- Team name, city, logo (ESPN CDN — free)
- Pick number and round
- Phase indicator: "Phase 1 — Preliminary" / "Phase 2 — Final" / "Window Closed"

### 9.2 Team Needs Panel
- Top 5 positional needs for the team on the clock
- Heat-map shading: red (premium + top need), orange (high need), yellow (moderate)
- Position premium multiplier shown inline per position

### 9.3 Live Odds Board
- All players with Kalshi YES odds > 1%
- Columns: Player | Pos | Scout Grade | Board Rank | Mock Rank | Kalshi Now | 7-Day Avg | $1 Payout | COMPASS Score
- Sorted by COMPASS score descending
- Taken players struck through and grayed
- Cell flash animation on price change > 2 points

### 9.4 AI Recommendation Card
Displayed prominently. Always shown, every pick.

- **Bot's Guess:** [Player Name] — the predicted actual pick regardless of bet
- **Bet Call:** BET YES / BET NO / PASS
- **Edge:** X.X points vs Kalshi market (only shown if ≥10)
- **Confidence:** HIGH / MEDIUM / LOW
- **Suggested Bet:** $XX (shown in large type; $0 on PASS)
- **Auto-Bet Status:** "$1 auto-bet placed" or "No auto-bet — edge below threshold"
- **Rationale:** 3–4 sentences from Claude
- **Signal Breakdown:** mini bar chart showing all 7 COMPASS inputs

### 9.5 Pick Submission
- "Mark Pick Made" button — select actual player from dropdown, confirm
- Updates player board (strikes through taken player)
- Writes outcome to DB (`player_picked`, `outcome`, P&L fields)
- Advances to next pick slot

### 9.6 Historical View
Full slide-out panel, accessible any time during the draft.
- Every completed pick as a timeline card
- Each card shows: pick #, team logo, bot's guess, actual pick, bet placed (Y/N), suggested amount, outcome (✅ hit / ❌ miss / ⏳ pending), auto P&L, suggested P&L
- Summary row at top: total auto P&L, total suggested P&L, hit rate
- Filter by: round / outcome / team / bet placed

### 9.7 Auto-Refresh
- Kalshi odds polled every 60 seconds via React Query
- Phase 2 Claude call triggered at poll #3 automatically
- Re-trigger only if odds shift >8 points after Phase 2

---

## 10. Data Sources (All Free)

### Player Grades & Rankings
| Source | Data | Access |
|---|---|---|
| nfldraftbuzz.com | Scout grade (0–100 avg), combine measurables, position rank | Free scrape |
| nflmockdraftdatabase.com | Consensus big board rank (157 boards) | Free scrape |

### Mock Draft Consensus
| Source | Data | Access |
|---|---|---|
| nflmockdraftdatabase.com | Consensus pick by slot (1,217 mocks) | Free scrape |
| drafttek.com | Independent mock cross-reference | Free scrape |

### Team Needs
| Source | Data | Access |
|---|---|---|
| nflmockdraftdatabase.com team pages | Per-team positional needs | One-time Claude seed at startup |

### Live Market Data
| Source | Data | Access |
|---|---|---|
| Kalshi REST API | Current YES/NO odds | Polled every 60s |
| Kalshi REST API | 7-day price history | Single fetch at startup |

---

## 11. Projected Cost

| Item | Cost |
|---|---|
| Supabase Free Tier | $0 |
| Kalshi API | $0 |
| Claude haiku (32 picks × ~700 tokens) | ~$1.28 |
| Claude haiku (edge re-triggers, ~5 calls) | ~$0.20 |
| Claude haiku (team needs seed, one-time) | ~$0.10 |
| All data sources | $0 |
| Hosting (localhost) | $0 |
| **Total** | **~$1.60** |

---

## 12. Success Metrics
- Bot's guess matches actual pick: target >40% (random baseline ~3%)
- Auto-bet hit rate: target >50%
- Suggested bet P&L: positive on the night
- Edge bets identified per round: 8–12
- Claude API cost for full draft: under $3
- Zero crashes during live session

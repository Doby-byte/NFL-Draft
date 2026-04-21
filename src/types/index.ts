export interface Player {
  id: number;
  name: string;
  position: string;
  school: string;
  buzz_grade: number;       // 0–100 from nfldraftbuzz.com
  consensus_rank: number;   // aggregated rank from 157 boards
  taken: boolean;
  taken_at_pick: number | null;
  taken_by_team: string | null;
}

export interface KalshiOdds {
  player_name: string;
  yes_price: number;        // 0.0–1.0
  no_price: number;
  ticker: string;
  payout_per_dollar: number;
}

export interface KalshiHistory {
  player_name: string;
  avg_7day: number;         // 0.0–1.0
}

export interface TeamNeed {
  position: string;
  rank: number;             // 1=top need, 5=minor, 0=none
}

export interface TeamNeeds {
  [team: string]: TeamNeed[];
}

export interface MockDraftSlot {
  pick_number: number;
  consensus_player_name: string;
  consensus_rank: number;
}

export interface CompassSignals {
  s1_scout_grade: number;
  s2_board_rank: number;
  s3_mock_alignment: number;
  s4_position_premium: number;
  s5_team_need: number;
  s6_kalshi_now: number;
  s7_7day_avg: number;
}

export interface CompassResult {
  player: Player;
  signals: CompassSignals;
  compass_score: number;    // 0–100
  kalshi_yes_price: number;
  kalshi_7day_avg: number;
  momentum: number;         // current - 7day avg
  payout_per_dollar: number;
  ticker: string;
}

export interface UserProfile {
  id: string;        // 'user_1' | 'user_2' | 'user_3' | 'user_4'
  display_name: string;
  created_at?: string;
}

export interface UserPick {
  id?: number;
  pick_number: number;
  user_id: string;
  player_chosen: string;
  kalshi_odds_at_pick: number | null;
  correct: boolean | null;
  hypothetical_payout: number | null;
  hypothetical_profit: number | null;
  created_at?: string;
}

export type AppMode = 'kids' | 'grownup';

export type BetCall = 'BET_YES' | 'BET_NO' | 'PASS';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type Phase = 1 | 2 | 'closed';

export interface BetDecision {
  bet_call: BetCall;
  edge: number;             // COMPASS/100 - kalshi_yes_price
  confidence: Confidence;
  suggested_bet: number;    // $0–$100
  bot_guess: string;
  bot_guess_confidence: Confidence;
}

export interface AIAnalysis {
  pick_rationale: string;    // Mel Kiper para: team fit / why this pick
  rationale: string;         // COMPASS/bet para: succinct score reasoning
  sentiment_summary: string; // one-liner: breaking news / insider signals
  sentiment_score: number;
  final_recommendation: BetCall;
  confidence: Confidence;
}

export interface PickPhase {
  pick_number: number;
  activated_at: Date;
  poll_count: number;
  phase: Phase;
  claude_fired: boolean;
  re_triggered: boolean;
  odds_at_phase1: number | null;
  odds_at_phase2: number | null;
  missed_window: boolean;
}

export interface DraftPick {
  id: number;
  pick_number: number;
  round: number;
  team: string;
  bot_guess: string;
  bot_guess_confidence: Confidence;
  ai_rationale: string | null;
  compass_score: number | null;
  edge_vs_market: number | null;
  bet_call: BetCall;
  auto_bet_placed: boolean;
  auto_bet_amount: number;
  auto_bet_side: 'yes' | 'no' | null;
  suggested_bet_amount: number;
  missed_window: boolean;
  odds_at_phase1: number | null;
  odds_at_phase2: number | null;
  odds_drift: number | null;
  player_picked: string | null;
  bot_guess_correct: boolean | null;
  auto_bet_outcome: 'hit' | 'miss' | 'pending' | 'no_bet' | null;
  auto_bet_payout: number | null;
  auto_bet_profit: number | null;
  suggested_bet_outcome: 'hit' | 'miss' | 'no_bet' | null;
  suggested_bet_payout: number | null;
  suggested_bet_profit: number | null;
  signal_snapshot: Record<string, CompassSignals> | null;
  all_player_scores: CompassResult[] | null;
  created_at: string;
  resolved_at: string | null;
}

export interface DraftSlot {
  pick_number: number;
  round: number;
  team: string;
  team_abbr: string;
}

export const NFL_DRAFT_ORDER: DraftSlot[] = [
  // ── Round 1 ──
  { pick_number: 1,  round: 1, team: 'Las Vegas Raiders',                        team_abbr: 'LV'  },
  { pick_number: 2,  round: 1, team: 'New York Jets',                            team_abbr: 'NYJ' },
  { pick_number: 3,  round: 1, team: 'Arizona Cardinals',                        team_abbr: 'ARI' },
  { pick_number: 4,  round: 1, team: 'Tennessee Titans',                         team_abbr: 'TEN' },
  { pick_number: 5,  round: 1, team: 'New York Giants',                          team_abbr: 'NYG' },
  { pick_number: 6,  round: 1, team: 'Cleveland Browns',                         team_abbr: 'CLE' },
  { pick_number: 7,  round: 1, team: 'Washington Commanders',                    team_abbr: 'WAS' },
  { pick_number: 8,  round: 1, team: 'New Orleans Saints',                       team_abbr: 'NO'  },
  { pick_number: 9,  round: 1, team: 'Kansas City Chiefs',                       team_abbr: 'KC'  },
  { pick_number: 10, round: 1, team: 'New York Giants (via CIN)',                team_abbr: 'NYG' },
  { pick_number: 11, round: 1, team: 'Miami Dolphins',                           team_abbr: 'MIA' },
  { pick_number: 12, round: 1, team: 'Dallas Cowboys',                           team_abbr: 'DAL' },
  { pick_number: 13, round: 1, team: 'Los Angeles Rams (via ATL)',               team_abbr: 'LAR' },
  { pick_number: 14, round: 1, team: 'Baltimore Ravens',                         team_abbr: 'BAL' },
  { pick_number: 15, round: 1, team: 'Tampa Bay Buccaneers',                     team_abbr: 'TB'  },
  { pick_number: 16, round: 1, team: 'New York Jets (via IND)',                  team_abbr: 'NYJ' },
  { pick_number: 17, round: 1, team: 'Detroit Lions',                            team_abbr: 'DET' },
  { pick_number: 18, round: 1, team: 'Minnesota Vikings',                        team_abbr: 'MIN' },
  { pick_number: 19, round: 1, team: 'Carolina Panthers',                        team_abbr: 'CAR' },
  { pick_number: 20, round: 1, team: 'Dallas Cowboys (via GB)',                  team_abbr: 'DAL' },
  { pick_number: 21, round: 1, team: 'Pittsburgh Steelers',                      team_abbr: 'PIT' },
  { pick_number: 22, round: 1, team: 'Los Angeles Chargers',                     team_abbr: 'LAC' },
  { pick_number: 23, round: 1, team: 'Philadelphia Eagles',                      team_abbr: 'PHI' },
  { pick_number: 24, round: 1, team: 'Cleveland Browns (via JAX)',               team_abbr: 'CLE' },
  { pick_number: 25, round: 1, team: 'Chicago Bears',                            team_abbr: 'CHI' },
  { pick_number: 26, round: 1, team: 'Buffalo Bills',                            team_abbr: 'BUF' },
  { pick_number: 27, round: 1, team: 'San Francisco 49ers',                      team_abbr: 'SF'  },
  { pick_number: 28, round: 1, team: 'Houston Texans',                           team_abbr: 'HOU' },
  { pick_number: 29, round: 1, team: 'Kansas City Chiefs (via LAR)',             team_abbr: 'KC'  },
  { pick_number: 30, round: 1, team: 'Miami Dolphins (via DEN)',                 team_abbr: 'MIA' },
  { pick_number: 31, round: 1, team: 'New England Patriots',                     team_abbr: 'NE'  },
  { pick_number: 32, round: 1, team: 'Seattle Seahawks',                         team_abbr: 'SEA' },
  // ── Round 2 ──
  { pick_number: 33, round: 2, team: 'New York Jets',                            team_abbr: 'NYJ' },
  { pick_number: 34, round: 2, team: 'Arizona Cardinals',                        team_abbr: 'ARI' },
  { pick_number: 35, round: 2, team: 'Tennessee Titans',                         team_abbr: 'TEN' },
  { pick_number: 36, round: 2, team: 'Las Vegas Raiders',                        team_abbr: 'LV'  },
  { pick_number: 37, round: 2, team: 'New York Giants',                          team_abbr: 'NYG' },
  { pick_number: 38, round: 2, team: 'Houston Texans (via WAS)',                 team_abbr: 'HOU' },
  { pick_number: 39, round: 2, team: 'Cleveland Browns',                         team_abbr: 'CLE' },
  { pick_number: 40, round: 2, team: 'Kansas City Chiefs',                       team_abbr: 'KC'  },
  { pick_number: 41, round: 2, team: 'Cincinnati Bengals',                       team_abbr: 'CIN' },
  { pick_number: 42, round: 2, team: 'New Orleans Saints',                       team_abbr: 'NO'  },
  { pick_number: 43, round: 2, team: 'Miami Dolphins',                           team_abbr: 'MIA' },
  { pick_number: 44, round: 2, team: 'New York Jets (via DAL)',                  team_abbr: 'NYJ' },
  { pick_number: 45, round: 2, team: 'Baltimore Ravens',                         team_abbr: 'BAL' },
  { pick_number: 46, round: 2, team: 'Tampa Bay Buccaneers',                     team_abbr: 'TB'  },
  { pick_number: 47, round: 2, team: 'Indianapolis Colts',                       team_abbr: 'IND' },
  { pick_number: 48, round: 2, team: 'Atlanta Falcons',                          team_abbr: 'ATL' },
  { pick_number: 49, round: 2, team: 'Minnesota Vikings',                        team_abbr: 'MIN' },
  { pick_number: 50, round: 2, team: 'Detroit Lions',                            team_abbr: 'DET' },
  { pick_number: 51, round: 2, team: 'Carolina Panthers',                        team_abbr: 'CAR' },
  { pick_number: 52, round: 2, team: 'Green Bay Packers',                        team_abbr: 'GB'  },
  { pick_number: 53, round: 2, team: 'Pittsburgh Steelers',                      team_abbr: 'PIT' },
  { pick_number: 54, round: 2, team: 'Philadelphia Eagles',                      team_abbr: 'PHI' },
  { pick_number: 55, round: 2, team: 'Los Angeles Chargers',                     team_abbr: 'LAC' },
  { pick_number: 56, round: 2, team: 'Jacksonville Jaguars',                     team_abbr: 'JAX' },
  { pick_number: 57, round: 2, team: 'Chicago Bears',                            team_abbr: 'CHI' },
  { pick_number: 58, round: 2, team: 'San Francisco 49ers',                      team_abbr: 'SF'  },
  { pick_number: 59, round: 2, team: 'Houston Texans',                           team_abbr: 'HOU' },
  { pick_number: 60, round: 2, team: 'Chicago Bears (via BUF)',                  team_abbr: 'CHI' },
  { pick_number: 61, round: 2, team: 'Los Angeles Rams',                         team_abbr: 'LAR' },
  { pick_number: 62, round: 2, team: 'Denver Broncos',                           team_abbr: 'DEN' },
  { pick_number: 63, round: 2, team: 'New England Patriots',                     team_abbr: 'NE'  },
  { pick_number: 64, round: 2, team: 'Seattle Seahawks',                         team_abbr: 'SEA' },
  // ── Round 3 ──
  { pick_number: 65, round: 3, team: 'Arizona Cardinals',                        team_abbr: 'ARI' },
  { pick_number: 66, round: 3, team: 'Tennessee Titans',                         team_abbr: 'TEN' },
  { pick_number: 67, round: 3, team: 'Las Vegas Raiders',                        team_abbr: 'LV'  },
  { pick_number: 68, round: 3, team: 'Philadelphia Eagles (via NYJ)',            team_abbr: 'PHI' },
  { pick_number: 69, round: 3, team: 'Houston Texans (via NYG)',                 team_abbr: 'HOU' },
  { pick_number: 70, round: 3, team: 'Cleveland Browns',                         team_abbr: 'CLE' },
  { pick_number: 71, round: 3, team: 'Washington Commanders',                    team_abbr: 'WAS' },
  { pick_number: 72, round: 3, team: 'Cincinnati Bengals',                       team_abbr: 'CIN' },
  { pick_number: 73, round: 3, team: 'New Orleans Saints',                       team_abbr: 'NO'  },
  { pick_number: 74, round: 3, team: 'Kansas City Chiefs',                       team_abbr: 'KC'  },
  { pick_number: 75, round: 3, team: 'Miami Dolphins',                           team_abbr: 'MIA' },
  { pick_number: 76, round: 3, team: 'Pittsburgh Steelers (via DAL)',            team_abbr: 'PIT' },
  { pick_number: 77, round: 3, team: 'Tampa Bay Buccaneers',                     team_abbr: 'TB'  },
  { pick_number: 78, round: 3, team: 'Indianapolis Colts',                       team_abbr: 'IND' },
  { pick_number: 79, round: 3, team: 'Atlanta Falcons',                          team_abbr: 'ATL' },
  { pick_number: 80, round: 3, team: 'Baltimore Ravens',                         team_abbr: 'BAL' },
  { pick_number: 81, round: 3, team: 'Jacksonville Jaguars (via DET)',           team_abbr: 'JAX' },
  { pick_number: 82, round: 3, team: 'Minnesota Vikings',                        team_abbr: 'MIN' },
  { pick_number: 83, round: 3, team: 'Carolina Panthers',                        team_abbr: 'CAR' },
  { pick_number: 84, round: 3, team: 'Green Bay Packers',                        team_abbr: 'GB'  },
  { pick_number: 85, round: 3, team: 'Pittsburgh Steelers',                      team_abbr: 'PIT' },
  { pick_number: 86, round: 3, team: 'Los Angeles Chargers',                     team_abbr: 'LAC' },
  { pick_number: 87, round: 3, team: 'Miami Dolphins (via PHI)',                 team_abbr: 'MIA' },
  { pick_number: 88, round: 3, team: 'Jacksonville Jaguars',                     team_abbr: 'JAX' },
  { pick_number: 89, round: 3, team: 'Chicago Bears',                            team_abbr: 'CHI' },
  { pick_number: 90, round: 3, team: 'Miami Dolphins (via HOU)',                 team_abbr: 'MIA' },
  { pick_number: 91, round: 3, team: 'Buffalo Bills',                            team_abbr: 'BUF' },
  { pick_number: 92, round: 3, team: 'Dallas Cowboys (via SF)',                  team_abbr: 'DAL' },
  { pick_number: 93, round: 3, team: 'Los Angeles Rams',                         team_abbr: 'LAR' },
  { pick_number: 94, round: 3, team: 'Miami Dolphins (via DEN)',                 team_abbr: 'MIA' },
  { pick_number: 95, round: 3, team: 'New England Patriots',                     team_abbr: 'NE'  },
  { pick_number: 96, round: 3, team: 'Seattle Seahawks',                         team_abbr: 'SEA' },
];

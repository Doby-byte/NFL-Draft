import type {
  Player, CompassSignals, CompassResult, BetCall, Confidence,
  BetDecision, TeamNeeds, KalshiOdds, KalshiHistory, MockDraftSlot
} from '@/types';

export const POSITION_PREMIUM: Record<string, number> = {
  QB: 1.00, OT: 0.85, EDGE: 0.80, CB: 0.72, WR: 0.65,
  DT: 0.60, TE: 0.55, LB: 0.52, S: 0.48,
  IOL: 0.42, RB: 0.32, FB: 0.10, K: 0.05, P: 0.05,
};

export function computeCompass(
  player: Player,
  pickNumber: number,
  teamAbbr: string,
  kalshiOdds: KalshiOdds | undefined,
  kalshiHistory: KalshiHistory | undefined,
  teamNeeds: TeamNeeds,
  mockData: MockDraftSlot[],
): CompassResult {
  const yesPrice = kalshiOdds?.yes_price ?? 0;
  const avg7day  = kalshiHistory?.avg_7day ?? yesPrice;

  // S1: Scout grade
  const s1 = (player.buzz_grade ?? 50) / 100;

  // S2: Consensus board rank (rank 1 → 1.0, rank 100+ → 0.0)
  const s2 = Math.max(0, 1 - ((player.consensus_rank - 1) / 99));

  // S3: Mock draft alignment
  const slotMock = mockData.find(m => m.pick_number === pickNumber);
  const slotConsensusRank = slotMock?.consensus_rank ?? player.consensus_rank;
  const rankDistance = Math.abs(player.consensus_rank - slotConsensusRank);
  const s3 = Math.max(0, 1 - rankDistance / 20);

  // S4: Position premium
  const s4 = POSITION_PREMIUM[player.position] ?? 0.30;

  // S5: Team need
  const needs = teamNeeds[teamAbbr] ?? [];
  const need = needs.find(n => n.position === player.position);
  const needRank = need?.rank ?? 0;
  const baseNeed: Record<number, number> = { 1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4, 5: 0.2, 0: 0.0 };
  const s5 = (baseNeed[needRank] ?? 0) * s4;

  // S6: Current Kalshi odds
  const s6 = yesPrice;

  // S7: 7-day trend
  const s7 = avg7day;

  const signals: CompassSignals = {
    s1_scout_grade: s1,
    s2_board_rank: s2,
    s3_mock_alignment: s3,
    s4_position_premium: s4,
    s5_team_need: s5,
    s6_kalshi_now: s6,
    s7_7day_avg: s7,
  };

  const compass_score = (
    s1 * 0.20 +
    s2 * 0.18 +
    s3 * 0.18 +
    s4 * 0.12 +
    s5 * 0.15 +
    s6 * 0.12 +
    s7 * 0.05
  ) * 100;

  return {
    player,
    signals,
    compass_score,
    kalshi_yes_price: yesPrice,
    kalshi_7day_avg: avg7day,
    momentum: yesPrice - avg7day,
    payout_per_dollar: kalshiOdds?.payout_per_dollar ?? 0,
    ticker: kalshiOdds?.ticker ?? '',
  };
}

export function computeBetDecision(results: CompassResult[]): BetDecision {
  const sorted = [...results].sort((a, b) => b.compass_score - a.compass_score);
  const top = sorted[0];

  if (!top) {
    return {
      bet_call: 'PASS',
      edge: 0,
      confidence: 'LOW',
      suggested_bet: 0,
      bot_guess: 'Unknown',
      bot_guess_confidence: 'LOW',
    };
  }

  const edge = (top.compass_score / 100) - top.kalshi_yes_price;

  const bet_call: BetCall =
    edge >= 0.10  ? 'BET_YES' :
    edge <= -0.10 ? 'BET_NO'  : 'PASS';

  const confidence: Confidence =
    edge > 0.18 && top.signals.s1_scout_grade > 0.85 && top.signals.s3_mock_alignment > 0.80
      ? 'HIGH'
      : edge > 0.10
      ? 'MEDIUM'
      : 'LOW';

  const suggested_bet = computeSuggestedBet(edge, confidence);

  const bot_guess_confidence: Confidence =
    top.compass_score > 75 ? 'HIGH' :
    top.compass_score > 55 ? 'MEDIUM' : 'LOW';

  return {
    bet_call,
    edge,
    confidence,
    suggested_bet,
    bot_guess: top.player.name,
    bot_guess_confidence,
  };
}

export function computeSuggestedBet(edge: number, confidence: Confidence): number {
  if (confidence === 'LOW' || edge < 0.10) return 0;

  const [lo, hi] =
    edge >= 0.20 ? [60, 100] :
    edge >= 0.15 ? [25,  60] :
                   [ 5,  25];

  const multiplier = confidence === 'HIGH' ? 1.0 : 0.6;
  const raw = lo + (hi - lo) * ((edge - 0.10) / 0.10) * multiplier;

  return Math.round(Math.min(100, Math.max(1, raw)) / 5) * 5;
}

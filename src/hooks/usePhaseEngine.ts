import { useEffect, useRef } from 'react';
import { useDraftStore } from '@/stores/draftStore';
import { NFL_DRAFT_ORDER } from '@/types';
import type { AIAnalysis } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

async function callAIPickAnalysis(payload: unknown): Promise<AIAnalysis> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-pick-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('AI analysis failed');
  return res.json();
}

async function fireAutoBet(ticker: string, amount: number, side: 'yes' | 'no') {
  await fetch(`${SUPABASE_URL}/functions/v1/run-draft-bets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker, amount, side }),
  });
}

export function usePhaseEngine() {
  const {
    currentPickIndex, currentPhase, compassResults, betDecision,
    teamNeeds, setAIAnalysis, advancePickPhase,
  } = useDraftStore();

  const firedRef     = useRef(false);
  const reTriggered  = useRef(false);
  const phase2OddsRef = useRef<number | null>(null);

  const slot = NFL_DRAFT_ORDER[currentPickIndex];

  // Reset refs when pick changes
  useEffect(() => {
    firedRef.current    = false;
    reTriggered.current = false;
    phase2OddsRef.current = null;
  }, [currentPickIndex]);

  useEffect(() => {
    if (!currentPhase || !slot || !betDecision) return;

    // Phase 2: fire Claude at poll #3
    if (currentPhase.poll_count === 3 && !firedRef.current) {
      firedRef.current = true;
      const top = compassResults[0];
      if (!top) return;

      const needs = (teamNeeds[slot.team_abbr] ?? [])
        .slice(0, 3).map(n => n.position);

      const payload = {
        pick: slot.pick_number,
        team: slot.team_abbr,
        team_needs: needs,
        top_player: {
          name: top.player.name,
          position: top.player.position,
          compass: top.compass_score,
          edge_vs_market: betDecision.edge,
          bet_call: betDecision.bet_call,
          confidence: betDecision.confidence,
          suggested_bet: betDecision.suggested_bet,
          s1_scout_grade: top.signals.s1_scout_grade,
          s2_board_rank: top.signals.s2_board_rank,
          s3_mock_alignment: top.signals.s3_mock_alignment,
          s4_position_premium: top.signals.s4_position_premium,
          s5_team_need: top.signals.s5_team_need,
          s6_kalshi_now: top.signals.s6_kalshi_now,
          s7_7day_avg: top.signals.s7_7day_avg,
          momentum: top.momentum,
        },
        instruction:
          `Search for any breaking news, insider reports, or beat reporter signals about pick #${slot.pick_number} and the ${slot.team_abbr} in the last 24 hours. Then write a 3-sentence rationale for this recommendation. Be direct and specific. Return only valid JSON, no markdown.`,
      };

      callAIPickAnalysis(payload)
        .then(analysis => {
          setAIAnalysis(analysis);
          advancePickPhase(2);
          phase2OddsRef.current = top.kalshi_yes_price;

          // Fire $1 auto-bet only if edge ≥ 10pts
          if (betDecision.bet_call !== 'PASS') {
            const side = betDecision.bet_call === 'BET_YES' ? 'yes' : 'no';
            fireAutoBet(top.ticker, 1.00, side).catch(console.error);
          }
        })
        .catch(console.error);
    }

    // Edge re-trigger: if odds drift >8pts after Phase 2
    if (
      firedRef.current &&
      !reTriggered.current &&
      phase2OddsRef.current !== null &&
      compassResults[0]
    ) {
      const drift = Math.abs(compassResults[0].kalshi_yes_price - phase2OddsRef.current);
      if (drift > 0.08) {
        reTriggered.current = true;
        const top = compassResults[0];
        const needs = (teamNeeds[slot.team_abbr] ?? []).slice(0, 3).map(n => n.position);

        const payload = {
          pick: slot.pick_number,
          team: slot.team_abbr,
          team_needs: needs,
          top_player: {
            name: top.player.name,
            position: top.player.position,
            compass: top.compass_score,
            edge_vs_market: betDecision.edge,
            bet_call: betDecision.bet_call,
            confidence: betDecision.confidence,
            suggested_bet: betDecision.suggested_bet,
            s1_scout_grade: top.signals.s1_scout_grade,
            s2_board_rank: top.signals.s2_board_rank,
            s3_mock_alignment: top.signals.s3_mock_alignment,
            s4_position_premium: top.signals.s4_position_premium,
            s5_team_need: top.signals.s5_team_need,
            s6_kalshi_now: top.signals.s6_kalshi_now,
            s7_7day_avg: top.signals.s7_7day_avg,
            momentum: top.momentum,
          },
          instruction: `ODDS SHIFTED ${Math.round(drift * 100)} POINTS since Phase 2. Re-evaluate. Search for any breaking news in last 30 minutes. Write updated 3-sentence rationale. Return only valid JSON, no markdown.`,
        };

        callAIPickAnalysis(payload)
          .then(analysis => setAIAnalysis(analysis))
          .catch(console.error);
      }
    }
  }, [currentPhase?.poll_count, compassResults]);
}

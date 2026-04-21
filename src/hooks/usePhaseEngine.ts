import { useCallback, useEffect, useRef } from 'react';
import { useDraftStore } from '@/stores/draftStore';
import { NFL_DRAFT_ORDER } from '@/types';
import { computeCompass, computeBetDecision } from '@/lib/compass';
import type { AIAnalysis, KalshiOdds, KalshiHistory } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

async function callAIPickAnalysis(payload: unknown): Promise<AIAnalysis> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-pick-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`AI analysis failed: ${res.status}`);
  return res.json();
}

async function fireAutoBet(ticker: string, amount: number, side: 'yes' | 'no') {
  await fetch(`${SUPABASE_URL}/functions/v1/run-draft-bets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker, amount, side }),
  });
}

async function fetchOddsForPick(pickNumber: number): Promise<{ odds: KalshiOdds[]; history: KalshiHistory[] }> {
  // Try real Kalshi first
  if (SUPABASE_URL) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/kalshi-proxy?path=/markets%3Fseries_ticker%3DKXNFLDRAFT%26pick%3D${pickNumber}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.ok) {
        const data: KalshiOdds[] = await res.json();
        if (data.length > 0) return { odds: data, history: [] };
      }
    } catch { /* fall through */ }
  }

  // Fall back to mock
  const mockRes = await fetch('/mock_kalshi.json');
  const mock = await mockRes.json() as { picks: Record<string, KalshiOdds[]>; history: Record<string, KalshiHistory[]> };
  const key = String(pickNumber);
  return {
    odds:    mock.picks[key]   ?? mock.picks['10']  ?? [],
    history: mock.history[key] ?? mock.history['3'] ?? [],
  };
}

export function usePhaseEngine() {
  const {
    currentPickIndex, currentPhase, compassResults: storeCompassResults,
    betDecision: storeBetDecision, players, teamNeeds, mockData,
    setCompassResults, setBetDecision, setAIAnalysis, advancePickPhase, incrementPoll,
  } = useDraftStore();

  const firedRef      = useRef(false);
  const reTriggered   = useRef(false);
  const phase2OddsRef = useRef<number | null>(null);
  const slot = NFL_DRAFT_ORDER[currentPickIndex];

  useEffect(() => {
    firedRef.current      = false;
    reTriggered.current   = false;
    phase2OddsRef.current = null;
  }, [currentPickIndex]);

  function buildPayload(compassRes: ReturnType<typeof computeCompass>[], betDec: ReturnType<typeof computeBetDecision>, instruction: string) {
    const top   = compassRes[0];
    const needs = (teamNeeds[slot.team_abbr] ?? []).slice(0, 3).map(n => n.position);
    return {
      pick: slot.pick_number,
      team: slot.team_abbr,
      team_needs: needs,
      top_player: {
        name: top.player.name, position: top.player.position,
        compass: top.compass_score, edge_vs_market: betDec.edge,
        bet_call: betDec.bet_call, confidence: betDec.confidence,
        suggested_bet: betDec.suggested_bet,
        s1_scout_grade: top.signals.s1_scout_grade,
        s2_board_rank:  top.signals.s2_board_rank,
        s3_mock_alignment: top.signals.s3_mock_alignment,
        s4_position_premium: top.signals.s4_position_premium,
        s5_team_need:   top.signals.s5_team_need,
        s6_kalshi_now:  top.signals.s6_kalshi_now,
        s7_7day_avg:    top.signals.s7_7day_avg,
        momentum:       top.momentum,
      },
      instruction,
    };
  }

  // Self-contained: fetch odds → run COMPASS → call Claude → update store
  // Bypasses firedRef so it always works as a manual trigger
  const runAnalysisNow = useCallback(async () => {
    if (!slot || players.length === 0) return;

    // Step 1: fetch fresh odds
    const { odds, history } = await fetchOddsForPick(slot.pick_number);

    const oddsMap    = new Map(odds.map(o => [o.player_name, o]));
    const historyMap = new Map(history.map(h => [h.player_name, h]));

    // Step 2: run COMPASS
    const results = players
      .filter(p => !p.taken && (oddsMap.get(p.name)?.yes_price ?? 0) > 0.01)
      .map(p => computeCompass(p, slot.pick_number, slot.team_abbr, oddsMap.get(p.name), historyMap.get(p.name), teamNeeds, mockData))
      .sort((a, b) => b.compass_score - a.compass_score);

    if (results.length === 0) return;

    const betDec = computeBetDecision(results);
    setCompassResults(results);
    setBetDecision(betDec);
    incrementPoll();

    // Step 3: call Claude
    firedRef.current = true;
    const payload = buildPayload(
      results, betDec,
      `Search for any breaking news, insider reports, or beat reporter signals about pick #${slot.pick_number} and the ${slot.team_abbr} in the last 24 hours. Then write a 3-sentence rationale for this recommendation. Be direct and specific. Return only valid JSON, no markdown.`
    );

    const analysis = await callAIPickAnalysis(payload);
    setAIAnalysis(analysis);
    advancePickPhase(2);
    phase2OddsRef.current = results[0].kalshi_yes_price;

    if (betDec.bet_call !== 'PASS') {
      const side = betDec.bet_call === 'BET_YES' ? 'yes' : 'no';
      fireAutoBet(results[0].ticker, 1.00, side).catch(console.error);
    }
  }, [slot, players, teamNeeds, mockData]);

  // Auto-trigger at poll #3 during live draft
  useEffect(() => {
    if (!currentPhase || !slot || !storeBetDecision || !storeCompassResults[0]) return;

    if (currentPhase.poll_count === 3 && !firedRef.current) {
      firedRef.current = true;
      const payload = buildPayload(
        storeCompassResults, storeBetDecision,
        `Search for any breaking news, insider reports, or beat reporter signals about pick #${slot.pick_number} and the ${slot.team_abbr} in the last 24 hours. Then write a 3-sentence rationale for this recommendation. Be direct and specific. Return only valid JSON, no markdown.`
      );
      callAIPickAnalysis(payload)
        .then(analysis => { setAIAnalysis(analysis); advancePickPhase(2); phase2OddsRef.current = storeCompassResults[0].kalshi_yes_price; })
        .catch(console.error);
    }

    // Edge re-trigger
    if (firedRef.current && !reTriggered.current && phase2OddsRef.current !== null && storeCompassResults[0]) {
      const drift = Math.abs(storeCompassResults[0].kalshi_yes_price - phase2OddsRef.current);
      if (drift > 0.08) {
        reTriggered.current = true;
        const payload = buildPayload(
          storeCompassResults, storeBetDecision,
          `ODDS SHIFTED ${Math.round(drift * 100)} POINTS since Phase 2. Re-evaluate. Search for any breaking news in last 30 minutes. Write updated 3-sentence rationale. Return only valid JSON, no markdown.`
        );
        callAIPickAnalysis(payload).then(setAIAnalysis).catch(console.error);
      }
    }
  }, [currentPhase?.poll_count, storeCompassResults]);

  return { runAnalysisNow };
}

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useDraftStore } from '@/stores/draftStore';
import { computeCompass, computeBetDecision } from '@/lib/compass';
import { NFL_DRAFT_ORDER } from '@/types';
import type { KalshiOdds, KalshiHistory } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

async function fetchKalshiOdds(pickNumber: number): Promise<KalshiOdds[]> {
  if (!SUPABASE_URL) return [];
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/kalshi-proxy?path=/markets%3Fseries_ticker%3DKXNFLDRAFT%26pick%3D${pickNumber}`,
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (!res.ok) throw new Error('Kalshi proxy error');
  return res.json();
}

async function fetchKalshiHistory(pickNumber: number): Promise<KalshiHistory[]> {
  if (!SUPABASE_URL) return [];
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/kalshi-proxy?path=/markets%2Fhistory%26pick%3D${pickNumber}`,
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (!res.ok) return [];
  return res.json();
}

export function useKalshiPolling() {
  const {
    currentPickIndex, players, teamNeeds, mockData,
    currentPhase, setCompassResults, setBetDecision,
    incrementPoll, advancePickPhase,
  } = useDraftStore();

  const slot = NFL_DRAFT_ORDER[currentPickIndex];
  const phaseRef = useRef(currentPhase);
  phaseRef.current = currentPhase;

  const oddsQuery = useQuery({
    queryKey: ['kalshi-odds', slot?.pick_number],
    queryFn: () => fetchKalshiOdds(slot.pick_number),
    refetchInterval: 60_000,
    enabled: !!slot && players.length > 0,
    staleTime: 55_000,
  });

  const historyQuery = useQuery({
    queryKey: ['kalshi-history', slot?.pick_number],
    queryFn: () => fetchKalshiHistory(slot.pick_number),
    enabled: !!slot,
    staleTime: 300_000,
  });

  useEffect(() => {
    if (!oddsQuery.data || !slot) return;

    const odds    = oddsQuery.data;
    const history = historyQuery.data ?? [];

    const oddsMap    = new Map(odds.map(o    => [o.player_name, o]));
    const historyMap = new Map(history.map(h => [h.player_name, h]));

    const activePlayers = players.filter(p => !p.taken);
    const results = activePlayers
      .filter(p => (oddsMap.get(p.name)?.yes_price ?? 0) > 0.01)
      .map(p => computeCompass(
        p, slot.pick_number, slot.team_abbr,
        oddsMap.get(p.name),
        historyMap.get(p.name),
        teamNeeds,
        mockData,
      ))
      .sort((a, b) => b.compass_score - a.compass_score);

    setCompassResults(results);
    setBetDecision(computeBetDecision(results));
    incrementPoll();

    const phase = phaseRef.current;
    if (phase) {
      if (phase.poll_count === 1) advancePickPhase(1);
      if (phase.poll_count === 3) advancePickPhase(2);
    }
  }, [oddsQuery.data]);

  return { oddsQuery, historyQuery };
}

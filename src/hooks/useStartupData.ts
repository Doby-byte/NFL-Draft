import { useEffect } from 'react';
import { useDraftStore } from '@/stores/draftStore';
import { supabase } from '@/lib/supabase';
import { NFL_DRAFT_ORDER } from '@/types';
import type { Player, DraftPick } from '@/types';

// Team needs seeded inline for startup (one-time Claude batch already done via script)
// Falls back to empty object if team_needs.json not present
async function loadTeamNeeds() {
  try {
    const res = await fetch('/team_needs.json');
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

async function loadMockData() {
  try {
    const res = await fetch('/mock_data.json');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function useStartupData() {
  const { setPlayers, setTeamNeeds, setMockData, setCompletedPicks, setCurrentPickIndex } = useDraftStore();

  useEffect(() => {
    async function load() {
      // Load players from Supabase
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .order('consensus_rank');
      if (players) setPlayers(players as Player[]);

      // Load completed picks and restore draft position
      const { data: picks } = await supabase
        .from('draft_picks')
        .select('*')
        .order('pick_number');
      if (picks && picks.length > 0) {
        const completed = picks as DraftPick[];
        setCompletedPicks(completed);

        // Restore currentPickIndex: find first NFL_DRAFT_ORDER slot not yet in draft_picks
        const completedPickNumbers = new Set(completed.map(p => p.pick_number));
        const nextIndex = NFL_DRAFT_ORDER.findIndex(slot => !completedPickNumbers.has(slot.pick_number));
        setCurrentPickIndex(nextIndex === -1 ? NFL_DRAFT_ORDER.length : nextIndex);

        // Mark taken players in store (players table taken flag may be stale)
        if (players) {
          const takenMap = new Map(completed.map(p => [p.player_picked, p]));
          const restored = (players as Player[]).map(p => {
            const pick = takenMap.get(p.name);
            return pick
              ? { ...p, taken: true, taken_at_pick: pick.pick_number, taken_by_team: pick.team }
              : p;
          });
          setPlayers(restored);
        }
      }

      // Load static JSON files
      const [teamNeeds, mockData] = await Promise.all([
        loadTeamNeeds(),
        loadMockData(),
      ]);
      setTeamNeeds(teamNeeds);
      setMockData(mockData);
    }

    load().catch(console.error);
  }, []);
}

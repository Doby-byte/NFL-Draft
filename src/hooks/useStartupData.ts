import { useEffect } from 'react';
import { useDraftStore } from '@/stores/draftStore';
import { supabase } from '@/lib/supabase';
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
  const { setPlayers, setTeamNeeds, setMockData, setCompletedPicks } = useDraftStore();

  useEffect(() => {
    async function load() {
      // Load players from Supabase
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .order('consensus_rank');
      if (players) setPlayers(players as Player[]);

      // Load completed picks (for resume if crashed mid-draft)
      const { data: picks } = await supabase
        .from('draft_picks')
        .select('*')
        .order('pick_number');
      if (picks) setCompletedPicks(picks as DraftPick[]);

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

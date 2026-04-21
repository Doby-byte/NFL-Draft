import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import type { UserProfile } from '@/types';

const SLOTS = ['user_1', 'user_2', 'user_3', 'user_4'];
const STARTING_BANK = 100;

const USER_COLORS = [
  'text-blue-400',
  'text-purple-400',
  'text-green-400',
  'text-orange-400',
];

interface Entry {
  id: string;
  name: string;
  pnl: number;
  isAI: boolean;
  colorIdx: number;
}

export function Leaderboard() {
  const { currentUser } = useUserStore();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [userPnl, setUserPnl] = useState<Record<string, number>>({});
  const [aiPnl, setAiPnl]     = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  // Load profiles + P&L on mount
  useEffect(() => {
    async function load() {
      const { data: profileData } = await supabase.from('user_profiles').select('*').in('id', SLOTS);
      if (profileData) setProfiles(profileData as UserProfile[]);

      // User P&L: sum hypothetical_profit grouped by user_id
      const { data: pickData } = await supabase
        .from('user_picks')
        .select('user_id, hypothetical_profit')
        .not('hypothetical_profit', 'is', null);
      if (pickData) {
        const pnl: Record<string, number> = {};
        pickData.forEach((r: { user_id: string; hypothetical_profit: number }) => {
          pnl[r.user_id] = (pnl[r.user_id] ?? 0) + (r.hypothetical_profit ?? 0);
        });
        setUserPnl(pnl);
      }

      // AI P&L: sum auto_bet_profit from draft_picks
      const { data: draftData } = await supabase
        .from('draft_picks')
        .select('auto_bet_profit')
        .not('auto_bet_profit', 'is', null);
      if (draftData) {
        const total = draftData.reduce((s: number, r: { auto_bet_profit: number }) => s + (r.auto_bet_profit ?? 0), 0);
        setAiPnl(total);
      }
    }
    load().catch(console.error);
  }, []);

  // Realtime: user_picks updates
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_picks' }, (payload) => {
        const row = payload.new as { user_id: string; hypothetical_profit: number | null };
        if (!row?.user_id) return;
        setUserPnl(prev => {
          // Re-fetch to avoid double-counting; simpler than tracking old rows
          supabase
            .from('user_picks')
            .select('user_id, hypothetical_profit')
            .not('hypothetical_profit', 'is', null)
            .then(({ data }) => {
              if (!data) return;
              const pnl: Record<string, number> = {};
              data.forEach((r: { user_id: string; hypothetical_profit: number }) => {
                pnl[r.user_id] = (pnl[r.user_id] ?? 0) + (r.hypothetical_profit ?? 0);
              });
              setUserPnl(pnl);
            });
          return prev;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, () => {
        supabase
          .from('draft_picks')
          .select('auto_bet_profit')
          .not('auto_bet_profit', 'is', null)
          .then(({ data }) => {
            if (!data) return;
            const total = data.reduce((s: number, r: { auto_bet_profit: number }) => s + (r.auto_bet_profit ?? 0), 0);
            setAiPnl(total);
          });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Build sorted entries
  const entries: Entry[] = [
    ...profiles.map((p, i) => ({
      id:       p.id,
      name:     p.display_name,
      pnl:      userPnl[p.id] ?? 0,
      isAI:     false,
      colorIdx: SLOTS.indexOf(p.id),
    })),
    { id: 'ai', name: 'AI', pnl: aiPnl, isAI: true, colorIdx: -1 },
  ].sort((a, b) => b.pnl - a.pnl);

  if (entries.length === 1 && entries[0].isAI && aiPnl === 0 && profiles.length === 0) return null;

  return (
    <div className="border-b border-slate-800 bg-[#0a0d13]">
      {/* Mobile: collapsible header */}
      <button
        className="w-full flex items-center justify-between px-4 py-2 sm:hidden"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">🏆 Leaderboard</span>
        <span className="text-xs text-slate-600">{collapsed ? '▼ show' : '▲ hide'}</span>
      </button>

      <div className={`${collapsed ? 'hidden sm:flex' : 'flex'} sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-0 px-2 pb-2 sm:pb-0 sm:py-2 overflow-x-auto`}>
        {entries.map((e, rank) => {
          const bank   = STARTING_BANK + e.pnl;
          const isMe   = e.id === currentUser?.id;
          const color  = e.isAI ? 'text-yellow-400' : USER_COLORS[e.colorIdx] ?? 'text-slate-300';
          const pnlStr = `${e.pnl >= 0 ? '+' : ''}$${Math.abs(e.pnl).toFixed(2)}`;

          return (
            <div
              key={e.id}
              className={`flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-none sm:border-r sm:border-slate-800 shrink-0 ${isMe ? 'bg-slate-800/50' : ''}`}
            >
              <div className="flex items-center gap-1.5 sm:gap-1">
                <span className="text-xs text-slate-600 font-bold w-4">{rank + 1}</span>
                {rank === 0 && <span className="text-xs">🏆</span>}
                <span className={`text-sm font-bold ${color}`}>{e.isAI ? '🤖 ' : ''}{e.name}</span>
                {isMe && <span className="text-xs text-slate-500">(you)</span>}
              </div>
              <div className="ml-auto sm:ml-0 text-right sm:text-left">
                <div className="text-xs text-slate-300 font-mono">${bank.toFixed(2)}</div>
                <div className={`text-xs font-semibold font-mono ${e.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnlStr}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

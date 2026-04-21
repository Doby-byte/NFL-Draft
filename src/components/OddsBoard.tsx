import { useState, useEffect, useRef } from 'react';
import { useDraftStore } from '@/stores/draftStore';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { formatOdds, formatPayout, cn } from '@/lib/utils';
import { NFL_DRAFT_ORDER } from '@/types';
import { WhyModal } from '@/components/WhyModal';
import type { CompassResult } from '@/types';

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-300 w-8">{value.toFixed(0)}</span>
    </div>
  );
}

function PriceCell({ current, prev }: { current: number; prev: number | null }) {
  const [flashClass, setFlashClass] = useState('');
  const prevRef = useRef(prev);

  useEffect(() => {
    if (prevRef.current === null || current === prevRef.current) return;
    const diff = current - prevRef.current;
    if (Math.abs(diff) > 0.02) {
      setFlashClass(diff > 0 ? 'flash-up' : 'flash-down');
      setTimeout(() => setFlashClass(''), 900);
    }
    prevRef.current = current;
  }, [current]);

  return <span className={cn('font-mono text-sm', flashClass)}>{formatOdds(current)}</span>;
}

export function OddsBoard() {
  const { compassResults, currentPickIndex } = useDraftStore();
  const { currentUser } = useUserStore();
  const prevOdds  = useRef<Map<string, number>>(new Map());
  const [whyResult, setWhyResult] = useState<CompassResult | null>(null);
  const [myPick, setMyPick]       = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);

  const slot = NFL_DRAFT_ORDER[currentPickIndex];

  // Load existing pick for this slot/user on mount and pick change
  useEffect(() => {
    setMyPick(null);
    if (!currentUser || !slot) return;
    supabase
      .from('user_picks')
      .select('player_chosen')
      .eq('pick_number', slot.pick_number)
      .eq('user_id', currentUser.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setMyPick(data.player_chosen); });
  }, [currentUser?.id, slot?.pick_number]);

  async function handleRowPick(r: CompassResult) {
    if (!currentUser || saving || r.player.taken) return;
    setSaving(true);
    const pick = {
      pick_number:         slot!.pick_number,
      user_id:             currentUser.id,
      player_chosen:       r.player.name,
      kalshi_odds_at_pick: r.kalshi_yes_price,
      correct:             null,
      hypothetical_payout: null,
      hypothetical_profit: null,
    };
    await supabase.from('user_picks').upsert(pick, { onConflict: 'pick_number,user_id' });
    setMyPick(r.player.name);
    setSaving(false);
  }

  if (compassResults.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center text-slate-500">
        Waiting for Kalshi odds...
      </div>
    );
  }

  const headers = ['Player', 'Pos', 'Scout', 'Board', 'Mock', 'Kalshi', '7d Avg', '$1 Pays', 'COMPASS', ''];

  const rows = compassResults.map((r: CompassResult) => {
    const prev = prevOdds.current.get(r.player.name) ?? null;
    prevOdds.current.set(r.player.name, r.kalshi_yes_price);
    return { ...r, prevOdds: prev };
  });

  return (
    <>
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {headers.map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isMyPick = myPick === r.player.name;
                return (
                  <tr
                    key={r.player.name}
                    onClick={() => handleRowPick(r)}
                    className={cn(
                      'border-b border-slate-800 transition-colors cursor-pointer',
                      r.player.taken
                        ? 'opacity-40 line-through cursor-default'
                        : isMyPick
                          ? 'bg-blue-900/30 hover:bg-blue-900/40'
                          : 'hover:bg-slate-700/30',
                    )}
                  >
                    <td className="px-3 py-2 font-medium text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {r.player.name}
                        {isMyPick && <span className="text-xs text-blue-400 font-bold">← your pick</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-400">{r.player.position}</td>
                    <td className="px-3 py-2 text-slate-300">{r.player.buzz_grade.toFixed(1)}</td>
                    <td className="px-3 py-2 text-slate-300">#{r.player.consensus_rank}</td>
                    <td className="px-3 py-2 text-slate-300">
                      #{r.signals.s3_mock_alignment ? Math.round(r.player.consensus_rank) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <PriceCell current={r.kalshi_yes_price} prev={r.prevOdds} />
                    </td>
                    <td className="px-3 py-2 text-slate-400 font-mono text-sm">{formatOdds(r.kalshi_7day_avg)}</td>
                    <td className="px-3 py-2 text-slate-300 font-mono text-sm">
                      {r.payout_per_dollar > 0 ? formatPayout(r.payout_per_dollar) : '—'}
                    </td>
                    <td className="px-3 py-2"><ScoreBar value={r.compass_score} /></td>
                    <td className="px-3 py-2">
                      {/* Why? button — only shown for players with meaningful odds */}
                      {r.kalshi_yes_price >= 0.01 && !r.player.taken && (
                        <button
                          onClick={e => { e.stopPropagation(); setWhyResult(r); }}
                          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors font-semibold whitespace-nowrap"
                        >
                          Why?
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {currentUser && (
          <div className="px-3 py-2 border-t border-slate-700/50 text-xs text-slate-500">
            Tap a row to record your pick for this slot
          </div>
        )}
      </div>

      {whyResult && <WhyModal result={whyResult} onClose={() => setWhyResult(null)} />}
    </>
  );
}

import { useState, useEffect } from 'react';
import { NFL_DRAFT_ORDER } from '@/types';
import { useDraftStore } from '@/stores/draftStore';
import type { CompassResult, SteelMan } from '@/types';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Props {
  result: CompassResult;
  onClose: () => void;
}

export function WhyModal({ result, onClose }: Props) {
  const { currentPickIndex, aiAnalysis } = useDraftStore();
  const slot = NFL_DRAFT_ORDER[currentPickIndex];

  // Check cache first — steelmans are pre-loaded when AI summary fires
  const cached = aiAnalysis?.steelmans?.[result.player.name] ?? null;

  const [data, setData]     = useState<SteelMan | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (cached) return; // already have it — no fetch needed
    fetchWhy();
  }, []);

  async function fetchWhy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/why-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({
          pick:       slot?.pick_number,
          team:       slot?.team_abbr,
          team_full:  slot?.team,
          player:     result.player.name,
          position:   result.player.position,
          school:     result.player.school,
          compass:    result.compass_score,
          scout:      result.signals.s1_scout_grade,
          board_rank: result.player.consensus_rank,
          kalshi_pct: Math.round(result.kalshi_yes_price * 100),
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json as SteelMan);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-bold text-white">{result.player.name}</div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              {result.player.position} · Pick #{slot?.pick_number} · {slot?.team_abbr} · {Math.round(result.kalshi_yes_price * 100)}¢
              {cached && <span className="text-green-600 text-xs">⚡ pre-loaded</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            Close ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading && (
            <div className="text-center py-10 space-y-3">
              <div className="text-2xl animate-pulse">🤔</div>
              <div className="text-slate-400 text-sm">Analyzing {result.player.name}...</div>
            </div>
          )}
          {error && (
            <div className="text-red-400 text-sm text-center py-8">
              <div className="text-2xl mb-2">⚠️</div>
              {error}
              <button onClick={fetchWhy} className="block mx-auto mt-3 text-blue-400 underline text-xs">Retry</button>
            </div>
          )}
          {data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-lg">✅</span>
                  <span className="text-green-300 font-bold text-sm uppercase tracking-wider">For</span>
                </div>
                <ul className="space-y-2">
                  {data.for.map((r, i) => (
                    <li key={i} className="text-slate-200 text-sm leading-snug flex gap-2">
                      <span className="text-green-500 shrink-0 mt-0.5">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-lg">❌</span>
                  <span className="text-red-300 font-bold text-sm uppercase tracking-wider">Against</span>
                </div>
                <ul className="space-y-2">
                  {data.against.map((r, i) => (
                    <li key={i} className="text-slate-200 text-sm leading-snug flex gap-2">
                      <span className="text-red-500 shrink-0 mt-0.5">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

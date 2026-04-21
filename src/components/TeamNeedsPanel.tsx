import { useDraftStore } from '@/stores/draftStore';
import { NFL_DRAFT_ORDER } from '@/types';
import { POSITION_PREMIUM } from '@/lib/compass';

const NEED_COLORS: Record<number, string> = {
  1: 'bg-red-500/30 border-red-500/50 text-red-300',
  2: 'bg-red-400/20 border-red-400/40 text-red-300',
  3: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  4: 'bg-yellow-500/15 border-yellow-500/35 text-yellow-300',
  5: 'bg-yellow-400/10 border-yellow-400/25 text-yellow-300',
};

export function TeamNeedsPanel() {
  const { currentPickIndex, teamNeeds } = useDraftStore();
  const slot = NFL_DRAFT_ORDER[currentPickIndex];
  if (!slot) return null;

  const needs = (teamNeeds[slot.team_abbr] ?? [])
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);

  if (needs.length === 0) return null;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
        Team Needs — {slot.team_abbr}
      </h3>
      <div className="flex flex-wrap gap-2">
        {needs.map((need) => {
          const premium = POSITION_PREMIUM[need.position] ?? 0.3;
          return (
            <div
              key={need.position}
              className={`border rounded-lg px-3 py-1.5 text-sm font-semibold flex items-center gap-2 ${NEED_COLORS[need.rank] ?? ''}`}
            >
              <span>{need.position}</span>
              <span className="text-xs opacity-60">×{premium.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

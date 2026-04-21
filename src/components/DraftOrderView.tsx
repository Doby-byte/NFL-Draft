import { useDraftStore } from '@/stores/draftStore';
import { NFL_DRAFT_ORDER } from '@/types';
import { espnLogoUrl } from '@/lib/utils';

export function DraftOrderView() {
  const { completedPicks, currentPickIndex } = useDraftStore();

  const pickedMap = new Map(completedPicks.map(p => [p.pick_number, p.player_picked ?? '']));

  return (
    <div className="max-w-4xl mx-auto space-y-2">
      <h2 className="text-lg font-bold text-white mb-4">2026 NFL Draft Order — Round 1</h2>
      {NFL_DRAFT_ORDER.map((slot) => {
        const picked     = pickedMap.get(slot.pick_number);
        const isCurrent  = slot.pick_number === NFL_DRAFT_ORDER[currentPickIndex]?.pick_number;
        const isPast     = !!picked;

        return (
          <div
            key={slot.pick_number}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
              isCurrent
                ? 'border-blue-500/60 bg-blue-500/10'
                : isPast
                ? 'border-slate-700/50 bg-slate-800/30'
                : 'border-slate-700/30 bg-slate-800/20'
            }`}
          >
            {/* Pick number */}
            <div className={`w-8 text-center font-mono text-sm font-bold shrink-0 ${
              isCurrent ? 'text-blue-400' : isPast ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {slot.pick_number}
            </div>

            {/* Team logo */}
            <img
              src={espnLogoUrl(slot.team_abbr)}
              alt={slot.team_abbr}
              className={`w-8 h-8 object-contain shrink-0 ${isPast ? 'opacity-50' : ''}`}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />

            {/* Team name */}
            <div className={`flex-1 text-sm font-semibold ${isPast ? 'text-slate-500' : 'text-slate-200'}`}>
              {slot.team}
            </div>

            {/* Selected player or status */}
            <div className="text-right">
              {picked ? (
                <span className="text-slate-300 text-sm font-medium">{picked}</span>
              ) : isCurrent ? (
                <span className="text-blue-400 text-xs font-semibold animate-pulse">ON THE CLOCK</span>
              ) : (
                <span className="text-slate-600 text-xs">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

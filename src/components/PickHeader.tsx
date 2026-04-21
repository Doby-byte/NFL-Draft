import { useDraftStore } from '@/stores/draftStore';
import { NFL_DRAFT_ORDER } from '@/types';
import { espnLogoUrl } from '@/lib/utils';

export function PickHeader() {
  const { currentPickIndex, currentPhase } = useDraftStore();
  const slot = NFL_DRAFT_ORDER[currentPickIndex];

  if (!slot) return (
    <div className="bg-slate-800 rounded-xl p-6 text-center text-slate-400 text-lg font-bold">
      🏈 Round 1 Complete
    </div>
  );

  const phaseLabel =
    !currentPhase ? 'Waiting for pick clock...' :
    currentPhase.phase === 1  ? 'Phase 1 — Preliminary' :
    currentPhase.phase === 2  ? 'Phase 2 — Final'       : 'Window Closed';

  const phaseColor =
    !currentPhase ? 'text-slate-500' :
    currentPhase.phase === 1  ? 'text-yellow-400' :
    currentPhase.phase === 2  ? 'text-green-400'  : 'text-red-400';

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
      <img
        src={espnLogoUrl(slot.team_abbr)}
        alt={slot.team}
        className="w-16 h-16 object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="flex-1">
        <div className="text-2xl font-bold text-white">{slot.team}</div>
        <div className="text-slate-400 text-sm">Round {slot.round} · Pick #{slot.pick_number}</div>
      </div>
      <div className={`text-sm font-semibold ${phaseColor} text-right`}>
        {phaseLabel}
        {currentPhase && (
          <div className="text-xs text-slate-500 mt-1">
            Poll #{currentPhase.poll_count}
          </div>
        )}
      </div>
    </div>
  );
}

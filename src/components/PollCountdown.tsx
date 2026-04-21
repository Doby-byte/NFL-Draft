import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDraftStore } from '@/stores/draftStore';
import { NFL_DRAFT_ORDER } from '@/types';

export function PollCountdown() {
  const { currentPickIndex, currentPhase } = useDraftStore();
  const slot = NFL_DRAFT_ORDER[currentPickIndex];
  const queryClient = useQueryClient();
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    if (!slot) return;

    const state = queryClient.getQueryState(['kalshi-odds', slot.pick_number]);
    const updatedAt = state?.dataUpdatedAt ?? Date.now();

    function tick() {
      const elapsed = Math.floor((Date.now() - updatedAt) / 1000);
      setSecondsLeft(Math.max(0, 60 - elapsed));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [slot?.pick_number, currentPhase?.poll_count]);

  if (!slot || !currentPhase) return null;

  const pollNum  = currentPhase.poll_count;
  const nextPoll = pollNum + 1;
  const pct      = ((60 - secondsLeft) / 60) * 100;

  const isPhase2Ready = pollNum >= 3;
  if (isPhase2Ready) return null;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400">
            Poll #{nextPoll} {nextPoll === 3 ? '— Claude fires 🤖' : ''}
          </span>
          <span className="text-slate-300 font-mono font-semibold">
            {secondsLeft}s
          </span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="text-xs text-slate-500 whitespace-nowrap">
        Poll {pollNum}/3
      </div>
    </div>
  );
}

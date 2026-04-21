import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDraftStore } from '@/stores/draftStore';
import { NFL_DRAFT_ORDER } from '@/types';

const STARS = ['✦', '✧', '✦', '✧', '✦'];

export function PollCountdown() {
  const { currentPickIndex, currentPhase, aiAnalysis } = useDraftStore();
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

  // Hide once AI analysis is done or poll count past phase 2
  if (aiAnalysis || currentPhase.poll_count >= 3) return null;

  const pct = ((60 - secondsLeft) / 60) * 100;
  const pollNum = currentPhase.poll_count;
  const isAboutToFire = pollNum === 2;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 overflow-hidden">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-slate-400">
          {isAboutToFire ? '🤖 Claude fires next poll!' : `Poll #${pollNum + 1} incoming`}
        </span>
        <span className="text-slate-300 font-mono font-semibold">{secondsLeft}s</span>
      </div>

      {/* Nyan Cat bar */}
      <div className="relative h-6 bg-slate-900 rounded-full overflow-hidden">
        {/* Rainbow trail */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00cc00, #0088ff, #8800ff)',
          }}
        />

        {/* Stars scattered in the trail */}
        {pct > 10 && STARS.map((s, i) => (
          <span
            key={i}
            className="absolute top-1/2 -translate-y-1/2 text-white text-[9px] pointer-events-none"
            style={{
              left: `${(pct * (i + 0.5)) / (STARS.length + 1)}%`,
              opacity: 0.85,
            }}
          >
            {s}
          </span>
        ))}

        {/* Nyan cat at the leading edge */}
        <span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-base pointer-events-none select-none"
          style={{ left: `${Math.max(pct, 2)}%` }}
        >
          🐱
        </span>

        {/* Dark overlay for unfilled portion — keeps cat readable */}
        <div
          className="absolute inset-y-0 right-0 bg-slate-900/60"
          style={{ width: `${100 - pct}%` }}
        />
      </div>

      <div className="text-xs text-slate-600 mt-1 text-right">poll {pollNum}/3</div>
    </div>
  );
}

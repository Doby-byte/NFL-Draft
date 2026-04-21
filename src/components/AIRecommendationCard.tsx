import { useDraftStore } from '@/stores/draftStore';
import { betCallColor, betCallBg, confidenceColor, formatEdge, cn } from '@/lib/utils';

const SIGNAL_LABELS: Record<string, string> = {
  s1_scout_grade: 'Scout',
  s2_board_rank: 'Board',
  s3_mock_alignment: 'Mock',
  s4_position_premium: 'Pos',
  s5_team_need: 'Need',
  s6_kalshi_now: 'Market',
  s7_7day_avg: 'Trend',
};

function SignalBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{Math.round(value * 100)}</span>
    </div>
  );
}

export function AIRecommendationCard() {
  const { betDecision, aiAnalysis, currentPhase } = useDraftStore();
  const top = useDraftStore(s => s.compassResults[0]);

  if (!betDecision || !top) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center text-slate-500">
        COMPASS running...
      </div>
    );
  }

  const { bet_call, edge, confidence, suggested_bet, bot_guess, bot_guess_confidence } = betDecision;
  const isPhase2 = currentPhase?.phase === 2;

  return (
    <div className={cn(
      'border rounded-xl p-5 space-y-4',
      betCallBg(bet_call)
    )}>
      {/* Bot's Guess */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bot's Guess</div>
          <div className="text-xl font-bold text-white">{bot_guess}</div>
          <div className={`text-xs font-semibold mt-0.5 ${confidenceColor(bot_guess_confidence)}`}>
            {bot_guess_confidence} confidence
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bet Call</div>
          <div className={`text-2xl font-black ${betCallColor(bet_call)}`}>{bet_call}</div>
          {bet_call !== 'PASS' && (
            <div className="text-xs text-slate-400 mt-0.5">{formatEdge(edge)}</div>
          )}
        </div>
      </div>

      {/* Suggested bet + auto-bet status */}
      <div className="flex items-center gap-6 border-t border-slate-700/50 pt-4">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Suggested Bet</div>
          <div className="text-3xl font-black text-white">
            ${suggested_bet}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Auto-Bet ($1)</div>
          {bet_call !== 'PASS' && edge >= 0.10 ? (
            <div className="text-green-400 text-sm font-semibold">
              {isPhase2 ? '✅ $1 auto-bet placed' : '⏳ Fires at Phase 2'}
            </div>
          ) : (
            <div className="text-slate-500 text-sm">No auto-bet — edge below threshold</div>
          )}
        </div>
      </div>

      {/* Rationale */}
      {aiAnalysis ? (
        <div className="border-t border-slate-700/50 pt-4 space-y-3">
          {/* Para 1: Mel Kiper expert pick take */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">🎙 Kiper's Take</span>
            </div>
            <p className="text-slate-100 text-sm leading-relaxed">{aiAnalysis.pick_rationale}</p>
          </div>

          {/* Para 2: COMPASS / bet reasoning */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Score &amp; Bet</div>
            <p className="text-slate-300 text-sm leading-relaxed">{aiAnalysis.rationale}</p>
          </div>

          {/* News/signals line */}
          {aiAnalysis.sentiment_summary && (
            <p className="text-slate-500 text-xs border-t border-slate-700/30 pt-2">
              📡 {aiAnalysis.sentiment_summary}
            </p>
          )}
        </div>
      ) : (
        <div className="border-t border-slate-700/50 pt-4 text-slate-500 text-sm">
          {currentPhase?.poll_count && currentPhase.poll_count < 3
            ? `AI rationale fires at poll #3 (current: #${currentPhase.poll_count})`
            : 'Fetching AI analysis...'}
        </div>
      )}

      {/* Signal breakdown */}
      <div className="border-t border-slate-700/50 pt-4 space-y-1.5">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Signal Breakdown</div>
        {Object.entries(top.signals).map(([key, val]) => (
          <SignalBar key={key} label={SIGNAL_LABELS[key] ?? key} value={val as number} />
        ))}
      </div>
    </div>
  );
}

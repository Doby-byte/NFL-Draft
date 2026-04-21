import { useState } from 'react';
import { useDraftStore } from '@/stores/draftStore';
import { espnLogoUrl, cn } from '@/lib/utils';
import type { DraftPick } from '@/types';

type Filter = 'all' | 'bet' | 'hit' | 'miss';

function PickCard({ pick }: { pick: DraftPick }) {
  const outcomeIcon =
    pick.auto_bet_outcome === 'hit'    ? '✅' :
    pick.auto_bet_outcome === 'miss'   ? '❌' :
    pick.auto_bet_outcome === 'no_bet' ? '—'  : '⏳';

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-3">
        <img
          src={espnLogoUrl(pick.team)}
          alt={pick.team}
          className="w-8 h-8 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500">Pick #{pick.pick_number} · {pick.team}</div>
          <div className="text-sm font-semibold text-white truncate">
            {pick.player_picked ?? 'Pending'}
          </div>
        </div>
        <span className="text-xl">{outcomeIcon}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-slate-500">Bot guess: </span>
          <span className={pick.bot_guess_correct ? 'text-green-400' : 'text-slate-300'}>
            {pick.bot_guess}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Bet: </span>
          <span className="text-slate-300">{pick.bet_call}</span>
        </div>
        <div>
          <span className="text-slate-500">Suggested: </span>
          <span className="text-slate-300">${pick.suggested_bet_amount}</span>
        </div>
        <div>
          <span className="text-slate-500">Auto P&L: </span>
          <span className={cn(
            'font-mono',
            (pick.auto_bet_profit ?? 0) > 0 ? 'text-green-400' :
            (pick.auto_bet_profit ?? 0) < 0 ? 'text-red-400'   : 'text-slate-400'
          )}>
            {pick.auto_bet_profit != null
              ? `${pick.auto_bet_profit >= 0 ? '+' : ''}$${pick.auto_bet_profit.toFixed(2)}`
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function HistoryDrawer() {
  const { showHistory, setShowHistory, completedPicks } = useDraftStore();
  const [filter, setFilter] = useState<Filter>('all');

  if (!showHistory) return null;

  const filtered = completedPicks.filter(p => {
    if (filter === 'bet')  return p.auto_bet_placed;
    if (filter === 'hit')  return p.auto_bet_outcome === 'hit';
    if (filter === 'miss') return p.auto_bet_outcome === 'miss';
    return true;
  });

  const totalAutoProfit = completedPicks.reduce((s, p) => s + (p.auto_bet_profit ?? 0), 0);
  const totalSuggestedProfit = completedPicks.reduce((s, p) => s + (p.suggested_bet_profit ?? 0), 0);
  const hitRate = completedPicks.length > 0
    ? Math.round(completedPicks.filter(p => p.bot_guess_correct).length / completedPicks.length * 100)
    : 0;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',  label: 'All' },
    { key: 'bet',  label: 'Bets Only' },
    { key: 'hit',  label: 'Hits' },
    { key: 'miss', label: 'Misses' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1" onClick={() => setShowHistory(false)} />
      <div className="w-full max-w-sm bg-slate-900 border-l border-slate-700 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">Pick History</h2>
          <button
            onClick={() => setShowHistory(false)}
            className="text-slate-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-700">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Auto P&L</div>
            <div className={cn('text-lg font-bold font-mono',
              totalAutoProfit >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {totalAutoProfit >= 0 ? '+' : ''}${totalAutoProfit.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Suggested</div>
            <div className={cn('text-lg font-bold font-mono',
              totalSuggestedProfit >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {totalSuggestedProfit >= 0 ? '+' : ''}${totalSuggestedProfit.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Guess %</div>
            <div className="text-lg font-bold text-blue-400">{hitRate}%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-3 border-b border-slate-700">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'text-xs px-2 py-1 rounded font-semibold transition-colors',
                filter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Pick cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-500 text-sm mt-8">No picks yet</div>
          ) : (
            [...filtered].reverse().map(p => (
              <PickCard key={p.pick_number} pick={p} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

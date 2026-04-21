import { useState } from 'react';
import { useDraftStore } from '@/stores/draftStore';
import { NFL_DRAFT_ORDER } from '@/types';
import { supabase } from '@/lib/supabase';
import type { DraftPick } from '@/types';

interface Props {
  onClose: () => void;
}

export function MarkPickModal({ onClose }: Props) {
  const {
    currentPickIndex, compassResults, betDecision, aiAnalysis,
    currentPhase, markPickMade, markPlayerTaken, players,
  } = useDraftStore();

  const slot = NFL_DRAFT_ORDER[currentPickIndex];
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  const availablePlayers = players.filter(p => !p.taken);

  async function handleConfirm() {
    if (!selected || !slot || !betDecision) return;
    setSaving(true);

    const top = compassResults[0];
    const betHit = selected === betDecision.bot_guess;
    const autoBetOutcome = betDecision.bet_call !== 'PASS'
      ? (betHit ? 'hit' : 'miss')
      : 'no_bet';
    const payout = top?.payout_per_dollar ?? 0;
    const autoBetProfit = autoBetOutcome === 'hit' ? payout - 1.0 : autoBetOutcome === 'miss' ? -1.0 : 0;
    const suggestedOutcome = betDecision.bet_call !== 'PASS'
      ? (betHit ? 'hit' : 'miss')
      : 'no_bet';
    const suggestedPayout = suggestedOutcome === 'hit' ? betDecision.suggested_bet * payout : 0;
    const suggestedProfit = suggestedOutcome === 'hit'
      ? suggestedPayout - betDecision.suggested_bet
      : suggestedOutcome === 'miss' ? -betDecision.suggested_bet : 0;

    const record: Partial<DraftPick> = {
      pick_number: slot.pick_number,
      round: slot.round,
      team: slot.team_abbr,
      bot_guess: betDecision.bot_guess,
      bot_guess_confidence: betDecision.bot_guess_confidence,
      ai_rationale: aiAnalysis?.rationale ?? null,
      compass_score: top?.compass_score ?? null,
      edge_vs_market: betDecision.edge,
      bet_call: betDecision.bet_call,
      auto_bet_placed: betDecision.bet_call !== 'PASS' && betDecision.edge >= 0.10,
      auto_bet_amount: betDecision.bet_call !== 'PASS' ? 1.0 : 0,
      auto_bet_side: betDecision.bet_call === 'BET_YES' ? 'yes' : betDecision.bet_call === 'BET_NO' ? 'no' : null,
      suggested_bet_amount: betDecision.suggested_bet,
      missed_window: currentPhase?.missed_window ?? false,
      odds_at_phase1: currentPhase?.odds_at_phase1 ?? null,
      odds_at_phase2: currentPhase?.odds_at_phase2 ?? null,
      odds_drift: currentPhase?.odds_at_phase1 && currentPhase?.odds_at_phase2
        ? currentPhase.odds_at_phase2 - currentPhase.odds_at_phase1 : null,
      player_picked: selected,
      bot_guess_correct: selected === betDecision.bot_guess,
      auto_bet_outcome: autoBetOutcome,
      auto_bet_payout: autoBetOutcome === 'hit' ? payout : null,
      auto_bet_profit: autoBetProfit,
      suggested_bet_outcome: suggestedOutcome,
      suggested_bet_payout: suggestedOutcome === 'hit' ? suggestedPayout : null,
      suggested_bet_profit: suggestedProfit,
      signal_snapshot: top ? { [top.player.name]: top.signals } : null,
      all_player_scores: compassResults.slice(0, 10) as DraftPick['all_player_scores'],
      resolved_at: new Date().toISOString(),
    };

    const { data } = await supabase.from('draft_picks').insert(record).select().single();
    markPlayerTaken(selected, slot.pick_number, slot.team_abbr);
    markPickMade(selected, data as DraftPick ?? record as DraftPick);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold text-white">
          Mark Pick #{slot?.pick_number} — {slot?.team}
        </h2>

        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
            Who was selected?
          </label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select player...</option>
            {availablePlayers.map(p => (
              <option key={p.id} value={p.name}>{p.name} ({p.position})</option>
            ))}
          </select>
        </div>

        {selected && betDecision && (
          <div className="bg-slate-700/50 rounded-lg p-3 text-sm space-y-1">
            <div className="text-slate-400">
              Bot guess: <span className="text-white font-semibold">{betDecision.bot_guess}</span>
            </div>
            <div className={selected === betDecision.bot_guess ? 'text-green-400' : 'text-red-400'}>
              {selected === betDecision.bot_guess ? '✅ Correct!' : '❌ Miss'}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || saving}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            {saving ? 'Saving...' : 'Confirm Pick'}
          </button>
        </div>
      </div>
    </div>
  );
}

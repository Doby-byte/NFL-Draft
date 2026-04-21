import { useState } from 'react';
import { useDraftStore } from '@/stores/draftStore';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { espnLogoUrl } from '@/lib/utils';
import { NFL_DRAFT_ORDER } from '@/types';
import type { CompassResult } from '@/types';

const GRADE_ORDER = ['A', 'B', 'C', 'D', 'F'] as const;

// Grade based on share of probability among the shown top-5.
function letterGrade(price: number, topSum: number): string {
  const share = topSum > 0 ? price / topSum : 0;
  if (share >= 0.40) return 'A';
  if (share >= 0.25) return 'B';
  if (share >= 0.16) return 'C';
  if (share >= 0.10) return 'D';
  return 'F';
}

function gradeColor(grade: string): string {
  return grade === 'A' ? 'text-green-400'  :
         grade === 'B' ? 'text-blue-400'   :
         grade === 'C' ? 'text-yellow-400' :
         grade === 'D' ? 'text-orange-400' : 'text-red-400';
}

const CARD_COLORS = [
  'from-blue-900/60    to-blue-950/80    border-blue-500/40',
  'from-purple-900/60  to-purple-950/80  border-purple-500/40',
  'from-green-900/60   to-green-950/80   border-green-500/40',
  'from-teal-900/60    to-teal-950/80    border-teal-500/40',
  'from-rose-900/60    to-rose-950/80    border-rose-500/40',
];

function kidsSentence(firstName: string, position: string, team: string, needRank: number): string {
  const topNeed = needRank <= 2;
  const posMap: Record<string, [string, string]> = {
    QB:   ['throw the ball really far!',               'they need someone who can lead the whole team!'],
    EDGE: ['run super fast and tackle the quarterback!','they really need someone to stop the other team!'],
    DT:   ['push through the big blockers!',           'they need someone really strong in the middle!'],
    CB:   ['run fast and knock away passes!',          'they need someone to cover the best receivers!'],
    WR:   ['catch the football and score touchdowns!', 'they need someone fast who can catch the ball!'],
    OT:   ['protect the quarterback like a bodyguard!','they need a big strong blocker!'],
    RB:   ['run with the ball and score points!',      'they need someone who can break tackles!'],
    S:    ['guard the whole field and stop big plays!','they need help protecting the back of the defense!'],
    LB:   ['tackle everyone and stop the run!',        'they need someone really tough in the middle!'],
    IOL:  ['protect the quarterback and open holes!',  'they need a big strong blocker up front!'],
    TE:   ['catch passes AND block — he does everything!','they need a player who can do two jobs at once!'],
  };
  const [skill, need] = posMap[position] ?? ['play really well!', 'they need a great player!'];
  return topNeed
    ? `The ${team} ${need} ${firstName} can ${skill}`
    : `${firstName} is one of the best at ${position}! He can ${skill}`;
}

export function KidsModeView() {
  const { compassResults, currentPickIndex } = useDraftStore();
  const { currentUser } = useUserStore();
  const [myPick, setMyPick] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const slot = NFL_DRAFT_ORDER[currentPickIndex];

  if (!slot) {
    return <div className="text-center py-12 text-slate-400 text-lg">🏈 Draft complete!</div>;
  }

  // Sort by Kalshi odds desc, COMPASS as tiebreaker.
  // If all odds are low/tied (pre-Kalshi mock data), still show top 5 by COMPASS.
  const sorted = [...compassResults]
    .filter(r => !r.player.taken && r.kalshi_yes_price >= 0.005)
    .sort((a, b) => b.kalshi_yes_price - a.kalshi_yes_price || b.compass_score - a.compass_score);

  const top5: CompassResult[] = sorted.slice(0, 5);
  const topSum = top5.reduce((s, r) => s + r.kalshi_yes_price, 0);

  // Sort top5 by grade (A→F), same-grade ties broken by odds — this IS the order we display
  const gradeRank = (p: CompassResult) =>
    GRADE_ORDER.indexOf(letterGrade(p.kalshi_yes_price, topSum) as typeof GRADE_ORDER[number]);

  const displayed = [...top5].sort(
    (a, b) => gradeRank(a) - gradeRank(b) || b.kalshi_yes_price - a.kalshi_yes_price
  );

  if (displayed.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl">⏳</div>
        <div className="text-xl font-bold text-slate-300">Loading picks...</div>
        <div className="text-slate-500 text-sm">Waiting for Kalshi odds</div>
      </div>
    );
  }

  async function handlePick(r: CompassResult) {
    if (!currentUser || saving) return;
    setSaving(true);
    await supabase.from('user_picks').upsert({
      pick_number:         slot.pick_number,
      user_id:             currentUser.id,
      player_chosen:       r.player.name,
      kalshi_odds_at_pick: r.kalshi_yes_price,
      correct:             null,
      hypothetical_payout: null,
      hypothetical_profit: null,
    }, { onConflict: 'pick_number,user_id' });
    setMyPick(r.player.name);
    setSaving(false);
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto px-2">
      {/* Pick header */}
      <div className="text-center space-y-1 py-2">
        <div className="flex items-center justify-center gap-3">
          <img
            src={espnLogoUrl(slot.team_abbr)}
            alt={slot.team_abbr}
            className="w-12 h-12 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div className="text-2xl font-black text-white">Pick #{slot.pick_number}</div>
            <div className="text-slate-400 text-sm">{slot.team}</div>
          </div>
        </div>
        {currentUser && (
          <div className="text-sm text-slate-500">
            {myPick ? `✅ You picked ${myPick}!` : `${currentUser.display_name}, who do you think they pick?`}
          </div>
        )}
      </div>

      {/* Top 5 cards — ordered A→F */}
      {displayed.map((r, i) => {
        const grade      = letterGrade(r.kalshi_yes_price, topSum);
        const pct        = Math.round(r.kalshi_yes_price * 100);
        const earnings   = r.kalshi_yes_price > 0 ? (1 / r.kalshi_yes_price) - 1 : 0;
        const earningsStr = earnings >= 0.995
          ? `$${earnings.toFixed(2)}`
          : `¢${Math.round(earnings * 100)}`;
        const firstName  = r.player.name.split(' ')[0];
        const needRank   = Math.round((1 - r.signals.s5_team_need) * 4) + 1;
        const sentence   = kidsSentence(firstName, r.player.position, slot.team_abbr, needRank);
        const isMyPick   = myPick === r.player.name;
        const colorClass = CARD_COLORS[i] ?? CARD_COLORS[CARD_COLORS.length - 1];

        return (
          <button
            key={r.player.name}
            onClick={() => handlePick(r)}
            disabled={saving}
            className={`
              w-full bg-gradient-to-br ${colorClass} border-2 rounded-2xl p-5 text-left
              transition-all duration-150 active:scale-95
              ${isMyPick ? 'ring-4 ring-white/30 scale-[1.02]' : 'hover:scale-[1.01]'}
              min-h-[120px] flex flex-col gap-3
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-xl font-black text-white leading-tight">{r.player.name}</div>
                <div className="text-slate-400 text-sm font-medium mt-0.5">{r.player.position} · {r.player.school}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-5xl font-black leading-none ${gradeColor(grade)}`}>{grade}</div>
                <div className="text-slate-300 text-sm font-mono mt-0.5">{pct}%</div>
              </div>
            </div>

            <p className="text-slate-200 text-sm leading-snug">{sentence}</p>

            <div className="flex items-center justify-between">
              <div className="bg-green-500/20 border border-green-500/40 text-green-300 text-sm font-bold px-3 py-1.5 rounded-full">
                💰 Earn {earningsStr}!
              </div>
              {isMyPick
                ? <div className="text-white font-bold text-sm">✅ Your pick!</div>
                : <div className="text-slate-500 text-sm">Tap to pick →</div>
              }
            </div>
          </button>
        );
      })}

      {!currentUser && (
        <p className="text-center text-slate-500 text-sm">Select a profile to make picks</p>
      )}
    </div>
  );
}

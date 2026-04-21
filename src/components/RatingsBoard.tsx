import { useDraftStore } from '@/stores/draftStore';
import { POSITION_PREMIUM } from '@/lib/compass';

const GRADE_COLOR = (g: number) =>
  g >= 90 ? 'text-green-400' :
  g >= 85 ? 'text-yellow-400' :
  g >= 80 ? 'text-orange-400' : 'text-slate-400';

const GRADE_BAR = (g: number) =>
  g >= 90 ? 'bg-green-500' :
  g >= 85 ? 'bg-yellow-500' :
  g >= 80 ? 'bg-orange-500' : 'bg-slate-500';

export function RatingsBoard() {
  const { players } = useDraftStore();

  const sorted = [...players].sort((a, b) => b.buzz_grade - a.buzz_grade);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-white mb-1">
        Player Ratings Board — 2026
      </h2>
      <p className="text-slate-500 text-sm mb-4">Sorted by scout grade · nfldraftbuzz.com all-scouts average</p>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider w-12">#</th>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider">Player</th>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider w-16">Pos</th>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider">School</th>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider w-20">Pos Premium</th>
              <th className="px-4 py-2.5 text-right text-xs text-slate-500 font-semibold uppercase tracking-wider w-32">Scout Grade</th>
              <th className="px-4 py-2.5 text-right text-xs text-slate-500 font-semibold uppercase tracking-wider w-20">Board</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => {
              const premium = POSITION_PREMIUM[player.position] ?? 0.3;
              return (
                <tr
                  key={player.id}
                  className={`border-b border-slate-800/60 ${
                    player.taken ? 'opacity-50' : i % 2 === 0 ? 'bg-slate-800/20' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <span className={`font-semibold ${player.taken ? 'line-through text-slate-500' : 'text-white'}`}>
                      {player.name}
                    </span>
                    {player.taken && (
                      <span className="ml-2 text-xs text-slate-600">
                        → #{player.taken_at_pick} {player.taken_by_team}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                      player.taken ? 'bg-slate-700/40 text-slate-500' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {player.position}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-sm ${player.taken ? 'text-slate-600' : 'text-slate-400'}`}>
                    {player.school}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-mono ${player.taken ? 'text-slate-600' : 'text-slate-400'}`}>
                      ×{premium.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${player.taken ? 'bg-slate-600' : GRADE_BAR(player.buzz_grade)}`}
                          style={{ width: `${player.buzz_grade}%` }}
                        />
                      </div>
                      <span className={`font-mono font-bold text-sm w-10 text-right ${
                        player.taken ? 'text-slate-600' : GRADE_COLOR(player.buzz_grade)
                      }`}>
                        {player.buzz_grade.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono text-xs ${player.taken ? 'text-slate-600' : 'text-slate-400'}`}>
                    #{player.consensus_rank}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

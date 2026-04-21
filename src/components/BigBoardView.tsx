import { useDraftStore } from '@/stores/draftStore';

export function BigBoardView() {
  const { players } = useDraftStore();

  const sorted = [...players].sort((a, b) => a.consensus_rank - b.consensus_rank);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-white mb-4">
        Consensus Big Board — 2026
        <span className="text-slate-500 font-normal text-sm ml-3">157 boards aggregated</span>
      </h2>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider w-12">Rank</th>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider">Player</th>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider w-16">Pos</th>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider">School</th>
              <th className="px-4 py-2.5 text-right text-xs text-slate-500 font-semibold uppercase tracking-wider w-20">Grade</th>
              <th className="px-4 py-2.5 text-right text-xs text-slate-500 font-semibold uppercase tracking-wider w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <tr
                key={player.id}
                className={`border-b border-slate-800/60 ${
                  player.taken ? 'opacity-60' : i % 2 === 0 ? 'bg-slate-800/20' : ''
                }`}
              >
                <td className="px-4 py-2.5 font-mono text-slate-500 text-xs">{player.consensus_rank}</td>
                <td className="px-4 py-2.5">
                  <span className={`font-semibold ${player.taken ? 'line-through text-slate-500' : 'text-white'}`}>
                    {player.name}
                  </span>
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
                <td className="px-4 py-2.5 text-right font-mono text-sm">
                  <span className={player.taken ? 'text-slate-600' : 'text-slate-300'}>
                    {player.buzz_grade.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {player.taken ? (
                    <span className="text-xs text-slate-500">
                      #{player.taken_at_pick} {player.taken_by_team}
                    </span>
                  ) : (
                    <span className="text-xs text-green-500/70">Available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

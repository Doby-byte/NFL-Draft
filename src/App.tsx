import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDraftStore } from '@/stores/draftStore';
import { useUserStore } from '@/stores/userStore';
import { useStartupData } from '@/hooks/useStartupData';
import { useKalshiPolling } from '@/hooks/useKalshiPolling';
import { usePhaseEngine } from '@/hooks/usePhaseEngine';
import { PickHeader } from '@/components/PickHeader';
import { TeamNeedsPanel } from '@/components/TeamNeedsPanel';
import { OddsBoard } from '@/components/OddsBoard';
import { AIRecommendationCard } from '@/components/AIRecommendationCard';
import { PollCountdown } from '@/components/PollCountdown';
import { MarkPickModal } from '@/components/MarkPickModal';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { DraftOrderView } from '@/components/DraftOrderView';
import { BigBoardView } from '@/components/BigBoardView';
import { RatingsBoard } from '@/components/RatingsBoard';
import { UserSelect } from '@/components/UserSelect';
import { Leaderboard } from '@/components/Leaderboard';
import { KidsModeView } from '@/components/KidsModeView';
import { NFL_DRAFT_ORDER } from '@/types';
import { cn } from '@/lib/utils';

const queryClient = new QueryClient();

type Tab = 'dashboard' | 'order' | 'bigboard' | 'ratings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: '🏈 Dashboard' },
  { key: 'order',     label: '📋 Draft Order' },
  { key: 'bigboard',  label: '📊 Big Board' },
  { key: 'ratings',   label: '⭐ Ratings' },
];

function DraftApp() {
  useStartupData();
  useKalshiPolling();
  const { runAnalysisNow } = usePhaseEngine();

  const [tab, setTab]           = useState<Tab>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const { setShowHistory, currentPickIndex, completedPicks, players,
          draftModeActive, setDraftModeActive } = useDraftStore();
  const { currentUser, appMode, setAppMode, logout } = useUserStore();
  const [aiLoading, setAiLoading] = useState(false);

  const slot           = NFL_DRAFT_ORDER[currentPickIndex];
  const isDraftComplete = currentPickIndex >= NFL_DRAFT_ORDER.length;
  const isKids         = appMode === 'kids';

  async function handleAINow() {
    setAiLoading(true);
    try { await runAnalysisNow(); } catch (e) { console.error(e); }
    setAiLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      {/* Top nav */}
      <header className="border-b border-slate-800 px-4 py-0 sticky top-0 bg-[#0f1117]/95 backdrop-blur z-30">
        <div className="flex items-center justify-between h-12 gap-2">
          {/* Logo + current user */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-black text-blue-400">DraftEdge</span>
            {currentUser && (
              <button
                onClick={logout}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors hidden sm:block"
                title="Switch user"
              >
                {currentUser.display_name} ↩
              </button>
            )}
          </div>

          {/* Tab nav — hidden in kids mode */}
          {!isKids && (
            <div className="flex items-center gap-1 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap',
                    tab === t.key
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Kids / Grown-Up toggle — always visible */}
            <button
              onClick={() => setAppMode(isKids ? 'grownup' : 'kids')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors border ${
                isKids
                  ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={isKids ? 'Switch to Grown-Up mode' : 'Switch to Kids mode'}
            >
              {isKids ? '👶 Kids' : '🎮 Grown-Up'}
            </button>

            <span className="text-xs text-slate-600 hidden sm:block">
              {completedPicks.length}/{NFL_DRAFT_ORDER.length}
            </span>

            {!isKids && (
              <>
                <button
                  onClick={() => setDraftModeActive(!draftModeActive)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors border ${
                    draftModeActive
                      ? 'bg-green-600/20 border-green-500/50 text-green-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {draftModeActive ? '🟢 LIVE' : '⏸ PAUSED'}
                </button>

                <button
                  onClick={() => setShowHistory(true)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  History
                </button>

                {!isDraftComplete && slot && tab === 'dashboard' && (
                  <>
                    <button
                      onClick={handleAINow}
                      disabled={aiLoading}
                      className="text-xs bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      {aiLoading ? '⏳...' : '🤖 AI Now'}
                    </button>
                    <button
                      onClick={() => setShowModal(true)}
                      className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      Mark Pick
                    </button>
                  </>
                )}
              </>
            )}

            {/* Kids mode Mark Pick — always visible so host can advance */}
            {isKids && !isDraftComplete && slot && (
              <button
                onClick={() => setShowModal(true)}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
              >
                Mark Pick
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Leaderboard — always visible */}
      <Leaderboard />

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 py-5">

        {/* ── Kids mode ── */}
        {isKids ? (
          <KidsModeView />
        ) : (
          <>
            {/* ── Dashboard ── */}
            {tab === 'dashboard' && (
              isDraftComplete ? (
                <div className="text-center py-20">
                  <div className="text-4xl font-black text-white mb-4">🏈 Round 1 Complete!</div>
                  <div className="text-slate-400 mb-8">{completedPicks.length} picks recorded.</div>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-lg transition-colors"
                  >
                    View Full Results
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  <div className="xl:col-span-2 space-y-4">
                    <PickHeader />
                    <TeamNeedsPanel />
                    <OddsBoard />
                  </div>
                  <div className="space-y-4">
                    <PollCountdown />
                    <AIRecommendationCard />
                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-center">
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Board Status</div>
                      <div className="text-2xl font-bold text-white">
                        {players.filter(p => p.taken).length}
                        <span className="text-slate-500 text-base font-normal"> / {players.length} taken</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {tab === 'order'    && <DraftOrderView />}
            {tab === 'bigboard' && <BigBoardView />}
            {tab === 'ratings'  && <RatingsBoard />}
          </>
        )}
      </main>

      {showModal && <MarkPickModal onClose={() => setShowModal(false)} />}
      <HistoryDrawer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppGate />
    </QueryClientProvider>
  );
}

// Gate: show UserSelect if no user is logged in
function AppGate() {
  const { currentUser } = useUserStore();
  if (!currentUser) return <UserSelect />;
  return <DraftApp />;
}

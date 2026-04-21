import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDraftStore } from '@/stores/draftStore';
import { useStartupData } from '@/hooks/useStartupData';
import { useKalshiPolling } from '@/hooks/useKalshiPolling';
import { usePhaseEngine } from '@/hooks/usePhaseEngine';
import { PickHeader } from '@/components/PickHeader';
import { TeamNeedsPanel } from '@/components/TeamNeedsPanel';
import { OddsBoard } from '@/components/OddsBoard';
import { AIRecommendationCard } from '@/components/AIRecommendationCard';
import { MarkPickModal } from '@/components/MarkPickModal';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { NFL_DRAFT_ORDER } from '@/types';

const queryClient = new QueryClient();

function DraftApp() {
  useStartupData();
  useKalshiPolling();
  usePhaseEngine();

  const [showModal, setShowModal] = useState(false);
  const { setShowHistory, currentPickIndex, completedPicks, players } = useDraftStore();

  const slot = NFL_DRAFT_ORDER[currentPickIndex];
  const isDraftComplete = currentPickIndex >= NFL_DRAFT_ORDER.length;

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      {/* Top nav */}
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-[#0f1117]/95 backdrop-blur z-30">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-blue-400">DraftEdge</span>
          <span className="text-xs text-slate-500 font-mono">2026 NFL Draft</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {completedPicks.length}/{NFL_DRAFT_ORDER.length} picks
          </span>
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            History
          </button>
          {!isDraftComplete && slot && (
            <button
              onClick={() => setShowModal(true)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              Mark Pick Made
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-5">
        {isDraftComplete ? (
          <div className="text-center py-20">
            <div className="text-4xl font-black text-white mb-4">🏈 Round 1 Complete!</div>
            <div className="text-slate-400 mb-8">
              {completedPicks.length} picks recorded. Open History to review P&L.
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-lg transition-colors"
            >
              View Full Results
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Left column: pick header + team needs + odds board */}
            <div className="xl:col-span-2 space-y-4">
              <PickHeader />
              <TeamNeedsPanel />
              <OddsBoard />
            </div>

            {/* Right column: AI recommendation */}
            <div className="space-y-4">
              <AIRecommendationCard />

              {/* Players taken count */}
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Board Status
                </div>
                <div className="text-2xl font-bold text-white">
                  {players.filter(p => p.taken).length}
                  <span className="text-slate-500 text-base font-normal"> / {players.length} taken</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals & drawers */}
      {showModal && <MarkPickModal onClose={() => setShowModal(false)} />}
      <HistoryDrawer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DraftApp />
    </QueryClientProvider>
  );
}

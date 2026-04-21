import { create } from 'zustand';
import type {
  Player, CompassResult, BetDecision, AIAnalysis,
  PickPhase, DraftPick, TeamNeeds, MockDraftSlot, Phase
} from '@/types';
import { NFL_DRAFT_ORDER } from '@/types';

interface DraftState {
  // Static data (loaded at startup)
  players: Player[];
  teamNeeds: TeamNeeds;
  mockData: MockDraftSlot[];

  // Current pick state
  currentPickIndex: number;
  currentPhase: PickPhase | null;

  // Live COMPASS results for current pick
  compassResults: CompassResult[];
  betDecision: BetDecision | null;
  aiAnalysis: AIAnalysis | null;

  // History
  completedPicks: DraftPick[];

  // UI
  showHistory: boolean;

  // Actions
  setPlayers: (players: Player[]) => void;
  setTeamNeeds: (needs: TeamNeeds) => void;
  setMockData: (data: MockDraftSlot[]) => void;
  setCompassResults: (results: CompassResult[]) => void;
  setBetDecision: (decision: BetDecision) => void;
  setAIAnalysis: (analysis: AIAnalysis) => void;
  incrementPoll: () => void;
  advancePickPhase: (phase: Phase) => void;
  markPickMade: (playerName: string, actualPick: DraftPick) => void;
  addCompletedPick: (pick: DraftPick) => void;
  setCompletedPicks: (picks: DraftPick[]) => void;
  setShowHistory: (show: boolean) => void;
  markPlayerTaken: (playerName: string, pickNumber: number, team: string) => void;
  resetCurrentPick: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  players: [],
  teamNeeds: {},
  mockData: [],
  currentPickIndex: 0,
  currentPhase: null,
  compassResults: [],
  betDecision: null,
  aiAnalysis: null,
  completedPicks: [],
  showHistory: false,

  setPlayers: (players) => set({ players }),
  setTeamNeeds: (teamNeeds) => set({ teamNeeds }),
  setMockData: (mockData) => set({ mockData }),
  setCompassResults: (compassResults) => set({ compassResults }),
  setBetDecision: (betDecision) => set({ betDecision }),
  setAIAnalysis: (aiAnalysis) => set({ aiAnalysis }),

  incrementPoll: () => set((state) => {
    if (!state.currentPhase) {
      const slot = NFL_DRAFT_ORDER[state.currentPickIndex];
      return {
        currentPhase: {
          pick_number: slot.pick_number,
          activated_at: new Date(),
          poll_count: 1,
          phase: 1,
          claude_fired: false,
          re_triggered: false,
          odds_at_phase1: null,
          odds_at_phase2: null,
          missed_window: false,
        }
      };
    }
    return {
      currentPhase: {
        ...state.currentPhase,
        poll_count: state.currentPhase.poll_count + 1,
      }
    };
  }),

  advancePickPhase: (phase) => set((state) => ({
    currentPhase: state.currentPhase
      ? { ...state.currentPhase, phase }
      : null,
  })),

  markPickMade: (_playerName, actualPick) => set((state) => ({
    completedPicks: [...state.completedPicks, actualPick],
    currentPickIndex: state.currentPickIndex + 1,
    currentPhase: null,
    compassResults: [],
    betDecision: null,
    aiAnalysis: null,
  })),

  addCompletedPick: (pick) => set((state) => ({
    completedPicks: [...state.completedPicks, pick],
  })),

  setCompletedPicks: (completedPicks) => set({ completedPicks }),

  setShowHistory: (showHistory) => set({ showHistory }),

  markPlayerTaken: (playerName, pickNumber, team) => set((state) => ({
    players: state.players.map(p =>
      p.name === playerName
        ? { ...p, taken: true, taken_at_pick: pickNumber, taken_by_team: team }
        : p
    ),
  })),

  resetCurrentPick: () => set({
    currentPhase: null,
    compassResults: [],
    betDecision: null,
    aiAnalysis: null,
  }),
}));

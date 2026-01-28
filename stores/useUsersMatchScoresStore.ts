import { create } from "zustand";
import {
  getMatchScore,
  submitScores,
  startScoringMatch,
} from "@/actions/ScoreActions";
import { getUserTeamId } from "@/actions/IndexActions";

type UserMatchScoreState = {
  loading: boolean;

  scoringModal: boolean;
  selectedMatchId: number | null;
  score: MatchScore | null;
  setCount: number;

  setSetCount: (setCount: number) => void;
  openScoring: (matchId: number) => void;
  closeScoring: () => void;

  fetchScore: (matchId: number) => Promise<void>;
  submitScore: (matchId: number, userId: string) => Promise<void>;
  beginScoring: () => void;
};

export const useUsersMatchScoresStore = create<UserMatchScoreState>(
  (set, get) => ({
    loading: false,

    scoringModal: false,
    selectedMatchId: null,
    score: null,
    setCount: 2,

    setSetCount: (setCount: number) => {
      set({ setCount: setCount });
    },
    openScoring: (matchId: number) => {
      get().fetchScore(matchId);
      set({ scoringModal: true, selectedMatchId: matchId, score: get().score });
    },
    closeScoring: () => {
      set({ scoringModal: false, selectedMatchId: null, score: null });
    },

    fetchScore: async (matchId: number) => {
      try {
        set({ loading: true });
        const ms = await getMatchScore(matchId);
        if (!ms) return;
      } finally {
        set({ loading: false });
      }
    },
    submitScore: async (matchId: number, userId: string) => {},
    beginScoring: () => {
      try {
        set({ loading: true });
        const match = get().selectedMatchId
        if(!match) return
      } finally {
        set({ loading: false });
      }
    },
  }),
);

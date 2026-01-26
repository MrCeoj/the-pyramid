import { create } from "zustand";
import {
  getUserMatches,
  acceptMatch,
  rejectMatch,
  cancelMatch,
} from "@/actions/MatchesActions";
import { getMatchScore } from "@/actions/ScoreActions";
import { getUserTeamId } from "@/actions/IndexActions";

type UsersMatchesState = {
  pending: MatchWithDetails[];
  active: MatchWithDetails[];
  history: MatchWithDetails[];

  loading: boolean;
  actionLoading: number | null;
  userTeamId: number | null;

  rejectedAmount: number;
  scoringModal: boolean;
  selectedScoringMatch: number | null;

  fetchMatches: (userId: string) => Promise<void>;
  fetchMatchScore: (matchId: number) => Promise<void>;
  toggleModal: (matchId?: number) => void;
  accept: (matchId: number, userId: string) => Promise<void>;
  reject: (matchId: number, userId: string) => Promise<void>;
  cancel: (matchId: number, userId: string) => Promise<void>;
  score: (matchId: number, userId: string) => Promise<void>;

  filtered: {
    pending: (pyramidId: number | null) => MatchWithDetails[];
    active: (pyramidId: number | null) => MatchWithDetails[];
    history: (pyramidId: number | null) => MatchWithDetails[];
  };
};

export const useUsersMatchesStore = create<UsersMatchesState>((set, get) => ({
  pending: [],
  active: [],
  history: [],

  loading: false,
  actionLoading: null,
  userTeamId: null,

  rejectedAmount: 0,
  scoringModal: false,
  selectedScoringMatch: null,

  fetchMatches: async (userId) => {
    set({ loading: true });
    try {
      const { pendingMatches, activeMatches, matchHistory } =
        await getUserMatches(userId);

      const utid = await getUserTeamId(userId);

      set({
        pending: pendingMatches,
        active: activeMatches,
        history: matchHistory,
        userTeamId: "error" in utid ? null : utid.teamId,
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchMatchScore: async (matchId)=>{},

  toggleModal: (matchId?: number) => {
    if (!!matchId) set({ selectedScoringMatch: matchId });
    else set({ selectedScoringMatch: null });
    set({ scoringModal: !get().scoringModal });
  },

  accept: async (matchId, userId) => {
    if (get().actionLoading) return;
    set({ actionLoading: matchId });
    try {
      await acceptMatch(matchId, userId);
      await get().fetchMatches(userId);
    } finally {
      set({ actionLoading: null });
    }
  },

  reject: async (matchId, userId) => {
    if (get().actionLoading) return;
    set({ actionLoading: matchId });
    try {
      await rejectMatch(matchId, userId);
      await get().fetchMatches(userId);
    } finally {
      set({ actionLoading: null });
    }
  },

  cancel: async (matchId, userId) => {
    if (get().actionLoading) return;
    set({ actionLoading: matchId });
    try {
      await cancelMatch(matchId);
      await get().fetchMatches(userId);
    } finally {
      set({ actionLoading: null });
    }
  },

  score: async (matchId, userId) => {
    if (get().actionLoading) return;
    set({ actionLoading: matchId });
    try {
    } finally {
      set({ actionLoading: null });
    }
  },

  filtered: {
    pending: (pyramidId) =>
      pyramidId
        ? get().pending.filter((m) => m.pyramidId === pyramidId)
        : get().pending,

    active: (pyramidId) =>
      pyramidId
        ? get().active.filter((m) => m.pyramidId === pyramidId)
        : get().active,

    history: (pyramidId) =>
      pyramidId
        ? get().history.filter((m) => m.pyramidId === pyramidId)
        : get().history,
  },
}));

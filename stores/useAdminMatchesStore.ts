"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { getPyramidMatches } from "@/actions/MatchesActions";
import { getAllPyramids } from "@/actions/PyramidActions";
import { completeMatch, cancelMatch } from "@/actions/MatchesActions/";

type AdminMatchesState = {
  matches: MatchWithDetails[];
  loading: boolean;
  completingMatch: number | null;
  cancelingMatch: number | null;
  selectedWinner: Record<number, number>;
  pyramids: Pick<Pyramid, "id" | "name">[];
  selectedPyramid: Pick<Pyramid, "id" | "name"> | null;

  fetchMatches: (pyramidId: number) => Promise<void>;
  fetchPyramids: () => Promise<void>;
  selectWinner: (matchId: number, teamId: number) => void;
  complete: (matchId: number) => Promise<void>;
  cancel: (matchId: number) => Promise<void>;
  clearWinner: (matchId: number) => void;
};

export const useAdminMatchesStore = create<AdminMatchesState>((set, get) => ({
  matches: [],
  loading: false,
  completingMatch: null,
  cancelingMatch: null,
  selectedWinner: {},
  pyramids: [],
  selectedPyramid: null,

  fetchMatches: async (pyramidId) => {
    set({ loading: true });
    try {
      const matches = await getPyramidMatches(pyramidId);
      set({ matches });
    } catch {
      toast.error("Error al cargar las retas");
    } finally {
      set({ loading: false });
    }
  },

  fetchPyramids: async () => {
    set({ loading: true });
    try {
      const pyramids = await getAllPyramids();
      set({ pyramids });
      if (pyramids) {
        set({ selectedPyramid: pyramids[0] });
      }
      const matches = await getPyramidMatches(pyramids![0].id);
      set({ matches });
    } catch {
      toast.error("Error al cargar las retas");
    } finally {
      set({ loading: false });
    }
  },

  selectWinner: (matchId, teamId) =>
    set((state) => ({
      selectedWinner: { ...state.selectedWinner, [matchId]: teamId },
    })),

  clearWinner: (matchId) =>
    set((state) => {
      const copy = { ...state.selectedWinner };
      delete copy[matchId];
      return { selectedWinner: copy };
    }),

  complete: async (matchId) => {
    const { selectedWinner, selectedPyramid, fetchMatches } = get();
    const winner = selectedWinner[matchId];

    if (!winner) toast.error("Selecciona un ganador");

    set({ completingMatch: matchId });
    try {
      const res = await completeMatch(matchId, winner);
      res.success ? toast.success(res.message) : toast.error(res.message);

      await fetchMatches(selectedPyramid!.id);
      get().clearWinner(matchId);
    } finally {
      set({ completingMatch: null });
    }
  },

  cancel: async (matchId) => {
    const { selectedPyramid, fetchMatches } = get();
    set({ cancelingMatch: matchId });

    try {
      const res = await cancelMatch(matchId);
      res.success ? toast.success("Reta cancelada") : toast.error(res.message);

      await fetchMatches(selectedPyramid!.id);
      get().clearWinner(matchId);
    } finally {
      set({ cancelingMatch: null });
    }
  },
}));

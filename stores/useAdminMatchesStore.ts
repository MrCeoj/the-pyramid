"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { getPyramidMatches } from "@/actions/MatchesActions";
import { getAllPyramids } from "@/actions/PyramidActions";
import { completeMatch, cancelMatch } from "@/actions/MatchesActions/";

type AdminMatchesState = {
  matches: MatchWithDetails[];
  filteredMatches: MatchWithDetails[];

  statusFilter: MatchStatus[];
  dateFilter: DateFilter;

  loading: boolean;
  completingMatch: number | null;
  cancelingMatch: number | null;
  selectedWinner: Record<number, number>;
  pyramids: Pick<Pyramid, "id" | "name">[];
  selectedPyramid: Pick<Pyramid, "id" | "name"> | null;

  fetchMatches: (pyramidId: number) => Promise<void>;
  fetchPyramids: () => Promise<void>;

  toggleStatusFilter: (status: MatchStatus) => void;
  resetStatusFilter: () => void;

  setRangeFilter: (from: string | null, to: string | null) => void;
  clearDateFilter: () => void;
  setSelectedPyramid: (pyramid: Pick<Pyramid, "id" | "name">) => void;
  selectWinner: (matchId: number, teamId: number) => void;
  complete: (matchId: number) => Promise<void>;
  cancel: (matchId: number) => Promise<void>;
  clearWinner: (matchId: number) => void;
};

const DEFAULT_FILTER: MatchStatus[] = ["pending", "accepted"];

const applyFilters = (
  matches: MatchWithDetails[],
  statusFilter: MatchStatus[],
  dateFilter: DateFilter,
) => {
  return matches.filter((m) => {
    // Status
    if (!statusFilter.includes(m.status)) return false;

    if (!dateFilter.mode) return true;

    const matchDate = new Date(m.createdAt);
    matchDate.setHours(0, 0, 0, 0);

    if (dateFilter.mode === "range" && dateFilter.from && dateFilter.to) {
      const from = new Date(dateFilter.from);
      const to = new Date(dateFilter.to);
      to.setHours(23, 59, 59, 999);

      return matchDate >= from && matchDate <= to;
    }

    return true;
  });
};

export const useAdminMatchesStore = create<AdminMatchesState>((set, get) => ({
  matches: [],
  filteredMatches: [],
  statusFilter: DEFAULT_FILTER,

  dateFilter: {
    mode: null,
    day: null,
    from: null,
    to: null,
  },

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
      const { statusFilter, dateFilter } = get();

      set({
        matches,
        filteredMatches: applyFilters(matches, statusFilter, dateFilter),
      });
    } catch {
      toast.error("Error al cargar las retas");
    } finally {
      set({ loading: false });
    }
  },

  toggleStatusFilter: (status) =>
    set((state) => {
      const next = state.statusFilter.includes(status)
        ? state.statusFilter.filter((s) => s !== status)
        : [...state.statusFilter, status];

      return {
        statusFilter: next,
        filteredMatches: applyFilters(state.matches, next, state.dateFilter),
      };
    }),

  setRangeFilter: (from, to) =>
    set((state) => {
      const dateFilter: DateFilter = {
        mode: from && to ? "range" : null,
        day: null,
        from,
        to,
      };

      return {
        dateFilter,
        filteredMatches: applyFilters(
          state.matches,
          state.statusFilter,
          dateFilter,
        ),
      };
    }),

  clearDateFilter: () =>
    set((state) => ({
      dateFilter: { mode: null, day: null, from: null, to: null },
      filteredMatches: applyFilters(state.matches, state.statusFilter, {
        mode: null,
        day: null,
        from: null,
        to: null,
      }),
    })),

  resetStatusFilter: () =>
    set((state) => ({
      statusFilter: DEFAULT_FILTER,
      filteredMatches: state.matches.filter((m) =>
        DEFAULT_FILTER.includes(m.status),
      ),
    })),

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

  setSelectedPyramid: (pyramid) =>
    set(() => ({
      selectedPyramid: pyramid,
    })),

  selectWinner: (matchId, teamId) =>{
    const ms = get().matches
    const m = ms.find(x => x.id === matchId)
    if (!m) return
    if (!!m.winnerTeam) return
    if (m.status === "cancelled") return
    if (m.status === "rejected") return
    set((state) => ({
      selectedWinner: { ...state.selectedWinner, [matchId]: teamId },
    }))},

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

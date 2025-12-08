"use client";
import { create } from "zustand";
import { PyramidData, PyramidOption } from "@/actions/IndexActions/types";

interface PyramidState {
  pyramids: PyramidOption[];
  selectedPyramidId: number | null;
  pyramidData: PyramidData | null;
  teamId: number | null;

  setPyramids: (pyramids: PyramidOption[]) => void;
  setSelectedPyramidId: (id: number | null) => void;
  setPyramidData: (data: PyramidData | null) => void;
  setTeamId: (id: number) => void;
  reset: () => void;
}

export const usePyramidStore = create<PyramidState>((set) => ({
  pyramids: [],
  selectedPyramidId: null,
  pyramidData: null,
  teamId: null,

  setPyramids: (pyramids) => set({ pyramids }),
  setSelectedPyramidId: (id) => set({ selectedPyramidId: id }),
  setPyramidData: (data) => set({ pyramidData: data }),
  setTeamId: (id) => set({teamId: id}),

  reset: () => set({ pyramids: [], selectedPyramidId: null, pyramidData: null }),
}));

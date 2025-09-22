"use client";

import { create } from "zustand";

type Team = {
  id: number;
  name: string;
  status: "winner" | "looser" | "idle" | "risky";
  wins: number;
  losses: number;
  categoryId: number;
};

type Position = {
  id: number;
  row: number;
  col: number;
  team: Team | null;
};

export type PyramidData = {
  positions: Position[];
  row_amount: number;
  pyramid_id: number;
  pyramid_name: string;
};

export type PyramidOption = {
  id: number;
  name: string;
  description: string | null;
};

interface PyramidState {
  pyramids: PyramidOption[];
  selectedPyramidId: number | null;
  pyramidData: PyramidData | null;

  // actions
  setPyramids: (pyramids: PyramidOption[]) => void;
  setSelectedPyramidId: (id: number | null) => void;
  setPyramidData: (data: PyramidData | null) => void;
  reset: () => void;
}

export const usePyramidStore = create<PyramidState>((set) => ({
  pyramids: [],
  selectedPyramidId: null,
  pyramidData: null,

  setPyramids: (pyramids) => set({ pyramids }),
  setSelectedPyramidId: (id) => set({ selectedPyramidId: id }),
  setPyramidData: (data) => set({ pyramidData: data }),

  reset: () => set({ pyramids: [], selectedPyramidId: null, pyramidData: null }),
}));

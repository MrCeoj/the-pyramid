// stores/pyramidStore.ts
import { create } from "zustand";

type Team = {
  id: number;
  name: string | null;
  wins: number | null;
  status: "winner" | "idle" | "looser" | "risky";
  losses: number | null;
  categoryId: number | null;
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
  pyramid_id?: number;
  pyramid_name?: string;
};

interface PyramidState {
  pyramidData: PyramidData | null;
  refreshKey: number; // Used to trigger data refresh
  setPyramidData: (data: PyramidData) => void;
  refreshPyramidData: () => void;
  getUserTeamPosition: (userTeamId: number) => Position | null;
}

export const usePyramidStore = create<PyramidState>((set, get) => ({
  pyramidData: null,
  refreshKey: 0,
  
  setPyramidData: (data) => set({ pyramidData: data }),
  
  refreshPyramidData: () => set((state) => ({ 
    refreshKey: state.refreshKey + 1 
  })),
  
  getUserTeamPosition: (userTeamId: number) => {
    const { pyramidData } = get();
    if (!pyramidData) return null;
    
    return pyramidData.positions.find(
      (pos) => pos.team && pos.team.id === userTeamId
    ) || null;
  },
}));
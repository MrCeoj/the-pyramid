// Update your PyramidHydrator component to handle default pyramid selection

"use client";
import { usePyramidStore } from "@/stores/usePyramidsStore";
import { useCallback, useEffect } from "react";
import { PyramidOption } from "@/actions/IndexActions/types";

interface PyramidHydratorProps {
  pyramids: PyramidOption[];
  defaultPyramidId?: number | null;
}

export const PyramidHydrator: React.FC<PyramidHydratorProps> = ({
  pyramids,
  defaultPyramidId,
}) => {
  const { setPyramids, setSelectedPyramidId, selectedPyramidId, setTeamId } =
    usePyramidStore();

  const initializeState = useCallback(() => {
    if (defaultPyramidId && !selectedPyramidId) {
      setSelectedPyramidId(defaultPyramidId);
      const teamId = pyramids.find((p) => p.id === defaultPyramidId)?.teamId;
      if (teamId) setTeamId(teamId);
    }
  }, [
    defaultPyramidId,
    pyramids,
    selectedPyramidId,
    setSelectedPyramidId,
    setTeamId,
  ]);

  useEffect(() => {
    setPyramids(pyramids);
  }, [pyramids, setPyramids]);

  useEffect(() => {
    initializeState();
  }, [initializeState]);

  return null;
};

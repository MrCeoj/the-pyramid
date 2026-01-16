// Update your PyramidHydrator component to handle default pyramid selection

"use client";
import { usePyramidStore } from "@/stores/usePyramidsStore";
import { useCallback, useEffect } from "react";

interface PyramidHydratorProps {
  pyramids: PyramidOption[];
  defaultPyramidId: number;
}

export const PyramidHydrator: React.FC<PyramidHydratorProps> = ({
  pyramids,
  defaultPyramidId,
}) => {
  const { setPyramids, setSelectedPyramidId, selectedPyramidId, setTeamId } =
    usePyramidStore();

  const initializeState = useCallback(() => {
    if (!selectedPyramidId) {
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

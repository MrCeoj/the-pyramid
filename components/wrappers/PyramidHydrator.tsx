// Update your PyramidHydrator component to handle default pyramid selection

"use client";
import { usePyramidStore } from "@/stores/usePyramidsStore";
import { useEffect } from "react";

interface PyramidHydratorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pyramids: any[]; // Replace with your actual pyramid type
  defaultPyramidId?: number | null;
}

export const PyramidHydrator: React.FC<PyramidHydratorProps> = ({ 
  pyramids, 
  defaultPyramidId 
}) => {
  const { setPyramids, setSelectedPyramidId, selectedPyramidId } = usePyramidStore();

  useEffect(() => {
    setPyramids(pyramids);
  }, [pyramids, setPyramids]);

  useEffect(() => {
    // Only set default if no pyramid is currently selected
    if (defaultPyramidId && !selectedPyramidId) {
      setSelectedPyramidId(defaultPyramidId);
    }
  }, [defaultPyramidId, selectedPyramidId, setSelectedPyramidId]);

  return null; // This is a hydration component, no UI
};
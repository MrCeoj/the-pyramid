"use client";
import { useEffect, useState, useCallback } from "react";
import PyramidRow from "./PyramidRow";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "react-hot-toast";
import { getUnresolvedMatchesForTeam } from "@/actions/matches/";
import { UnresolvedMatch } from "@/actions/matches/types";
import { PyramidData } from "@/actions/IndexActions";
import { TeamWithPlayers } from "@/actions/PositionActions";

// Rename to avoid conflict with imported Position type
type PyramidPosition = {
  id: number;
  row: number;
  col: number;
  team: TeamWithPlayers | null;
};

export default function PyramidDisplay({
  data,
  userTeamId,
}: {
  data: PyramidData;
  userTeamId?: number | null;
}) {
  const [unresolvedMatches, setUnresolvedMatches] = useState<UnresolvedMatch[]>(
    []
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUnresolvedMatches = useCallback(async () => {
    if (!userTeamId) return;

    setIsRefreshing(true);
    try {
      const data = await getUnresolvedMatchesForTeam(userTeamId);
      setUnresolvedMatches(data || []);
    } catch (err) {
      console.error("Error fetching unresolved matches:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [userTeamId]);

  useEffect(() => {
    fetchUnresolvedMatches();
  }, [fetchUnresolvedMatches]);

  // Refresh callback to pass to PyramidRow
  const handleRefreshNeeded = useCallback(() => {
    fetchUnresolvedMatches();
  }, [fetchUnresolvedMatches]);

  const isMobile = useIsMobile();

  // Transform all positions once at the beginning
  const allPyramidPositions: PyramidPosition[] = data.positions.map((pos) => ({
    id: pos.id,
    row: pos.row,
    col: pos.col,
    team: pos.team as TeamWithPlayers | null, // Type assertion
  }));

  const rows: { [key: number]: PyramidPosition[] } = {};
  allPyramidPositions.forEach((pos) => {
    if (!pos) return;
    if (!rows[pos.row]) rows[pos.row] = [];
    rows[pos.row].push(pos);
  });

  const filledRows: { [key: number]: PyramidPosition[] } = {};
  for (let row = 1; row <= data.row_amount; row++) {
    const expectedCols = row + 1;
    const existing = rows[row] ?? [];
    const filled: PyramidPosition[] = [];

    for (let col = 1; col < expectedCols; col++) {
      const match = existing.find((p) => p.col === col);
      if (match) {
        filled.push(match);
      } else {
        filled.push({
          id: -1 * (row * 100 + col),
          row,
          col,
          team: null,
        });
      }
    }
    filledRows[row] = filled;
  }

  return (
    <div className="flex flex-col items-center relative mb-5 no-scrollbar">
      {/* Logo Display */}
      <Toaster position={isMobile ? "top-center" : "top-right"} />
      {isMobile ? (
        <Image
          src={"/piramide_logo_title_naranja.svg"}
          alt="Logo"
          width={200}
          height={120}
          className="static drop-shadow-slate-700 drop-shadow-[0_0_0.3rem]"
        />
      ) : (
        <div className="max-w-1/4 w-[16rem] h-[8rem] lg:w-[400px] lg:h-[160px] absolute left-2">
          <Image
            src={"/piramide_logo_title_naranja.svg"}
            priority
            alt="Logo"
            fill
            style={{ objectFit: "cover" }}
            className="drop-shadow-slate-700 drop-shadow-[0_0_0.3rem]"
          />
        </div>
      )}
      {/* Pyramid Structure */}
      <div className="flex flex-col items-center mb-5">
        {Object.keys(filledRows)
          .sort((a, b) => Number(a) - Number(b))
          .map((rowKey, index, array) => {
            const rowPositions = filledRows[Number(rowKey)];
            const isFirst = index === 0;
            const isLast = index === array.length - 1;
            return (
              <PyramidRow
                key={rowKey}
                positions={rowPositions}
                onTeamClick={() => {}}
                isFirst={isFirst}
                allPositions={allPyramidPositions}
                unresolvedMatches={unresolvedMatches}
                userTeamId={userTeamId}
                pyramidId={data.pyramid_id!}
                onRefreshNeeded={handleRefreshNeeded}
                className={`flex gap-4 p-4 justify-start min-w-max overflow-x-scroll scroll-smooth no-scrollbar items-center snap-x rounded-t-2xl border-2 border-slate-400/40 border-dashed bg-indor-black/80 ${
                  isLast ? "border-b-2 rounded-b-2xl" : "border-b-0"
                } ${isRefreshing ? "opacity-75" : ""}`}
              />
            );
          })}
      </div>

      {/* Optional: Show refresh indicator */}
      {isRefreshing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white px-4 py-2 rounded-lg">
          Actualizando...
        </div>
      )}
    </div>
  );
}

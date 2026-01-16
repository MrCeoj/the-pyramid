"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import PyramidRow from "./PyramidRow";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { getUnresolvedMatchesForTeam } from "@/actions/MatchesActions/";
import CellarRow from "./CellarRow";
import InactivePyramidModal from "./InactivePyramidModal";
import { useSessionStore } from "@/stores/sessionStore";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [unresolvedMatches, setUnresolvedMatches] = useState<UnresolvedMatch[]>(
    []
  );
  const [cellarTeam, setCellarTeam] = useState<PyramidPosition>({
    id: 123,
    row: 8,
    col: 1,
    team: null,
  });
  const {session} = useSessionStore()

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
    const role = session?.user.role

    if (data.active === false && role === 'player') {
      setShowInactiveModal(true);
    } else {
      setShowInactiveModal(false);
    }

    
  }, [data.active, session]);

  useEffect(() => {
    if (userTeamId) fetchUnresolvedMatches();
  }, [userTeamId, fetchUnresolvedMatches]);

  const isMobile = useIsMobile();

  // Transform all positions once at the beginning
  const allPyramidPositions = useMemo(
    () =>
      data.positions.map((pos) => ({
        id: pos.id,
        row: pos.row,
        col: pos.col,
        team: pos.team as TeamWithPlayers | null,
      })),
    [data.positions]
  );

  const rows = useMemo(() => {
    const rowsMap: { [key: number]: PyramidPosition[] } = {};
    data.positions.forEach((pos) => {
      if (!rowsMap[pos.row]) rowsMap[pos.row] = [];
      const pyramidPos: PyramidPosition = {
        id: pos.id,
        row: pos.row,
        col: pos.col,
        team: pos.team as TeamWithPlayers | null,
      };
      rowsMap[pos.row].push(pyramidPos);
    });
    return rowsMap;
  }, [data.positions]);

  const filledRows = useMemo(() => {
    const rowsMap: Record<number, PyramidPosition[]> = {};
    for (let row = 1; row <= data.row_amount; row++) {
      const expectedCols = row + 1;
      const existing = data.positions.filter((p) => p.row === row);
      const filled: PyramidPosition[] = [];
      for (let col = 1; col < expectedCols; col++) {
        const match = existing.find((p) => p.col === col);
        filled.push(
          match
            ? {
                id: match.id,
                row: match.row,
                col: match.col,
                team: match.team as TeamWithPlayers | null,
              }
            : { id: -1 * (row * 100 + col), row, col, team: null }
        );
      }
      rowsMap[row] = filled;
    }
    return rowsMap;
  }, [data.positions, data.row_amount]);

  useEffect(() => {
    if (!rows[8]) setCellarTeam({ id: 123, row: 8, col: 1, team: null });
    if (rows[8] && rows[8].length > 0) setCellarTeam(rows[8][0]);
  }, [rows]);

  return (
    <div className="flex flex-col w-screen items-center relative mb-5 no-scrollbar -z-20">
      {/* Logo Display */}
      {isMobile ? (
        <Image
          src={"/piramide_logo_title_naranja.svg"}
          alt="Logo"
          width={200}
          height={120}
          className="drop-shadow-slate-700 drop-shadow-[0_0_0.3rem]"
        />
      ) : (
        <div className="absolute left-8 lg:left-20 aspect-video w-[16rem] lg:w-[18rem] xl:w-[20rem]">
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
                active={data.active}
                pyramidId={data.pyramid_id!}
                className={`flex gap-4 p-4 justify-start min-w-max overflow-x-scroll scroll-smooth 
                  no-scrollbar items-center snap-x rounded-t-2xl border-2 border-slate-400/40 
                  border-dashed bg-indor-black/80 ${
                    isLast ? "border-b-2 rounded-b-2xl" : "border-b-0"
                  } ${isRefreshing ? "opacity-75" : ""}`}
              />
            );
          })}
      </div>

      {/* The Cellar */}
      <div className="mb-5">
        <CellarRow
          userTeamId={userTeamId}
          position={cellarTeam!}
          active={data.active}
          isFirst={true}
          isLast={true}
        />
      </div>

      {/* Optional: Show refresh indicator */}
      {isRefreshing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white px-4 py-2 rounded-lg">
          Actualizando...
        </div>
      )}

      <InactivePyramidModal
        isOpen={showInactiveModal}
        onClose={() => setShowInactiveModal(false)}
      />
    </div>
  );
}

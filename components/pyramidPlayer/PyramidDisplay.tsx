"use client";
import { useEffect, useState } from "react";
import PyramidRow from "./PyramidRow";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "react-hot-toast";
import {
  UnresolvedMatch,
  getUnresolvedMatchesForTeam,
} from "@/actions/MatchesActions";

type Team = {
  id: number;
  name: string;
  wins: number;
  losses: number;
  status: "winner" | "idle" | "looser" | "risky";
  categoryId: number;
  players: string[]
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

  useEffect(() => {
    if (!userTeamId) return;
    (async () => {
      try {
        const data = await getUnresolvedMatchesForTeam(userTeamId);
        setUnresolvedMatches(data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [userTeamId]);

  const isMobile = useIsMobile();

  const rows: { [key: number]: Position[] } = {};
  data.positions.forEach((pos) => {
    if (!rows[pos.row]) rows[pos.row] = [];
    rows[pos.row].push(pos);
  });

  const filledRows: { [key: number]: Position[] } = {};
  for (let row = 1; row <= data.row_amount; row++) {
    const expectedCols = row + 1;
    const existing = rows[row] ?? [];
    const filled: Position[] = [];

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
            alt="Logo"
            fill
            objectFit="cover"
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
                allPositions={data.positions}
                unresolvedMatches={unresolvedMatches}
                userTeamId={userTeamId}
                pyramidId={data.pyramid_id!}
                className={`flex gap-4 p-4 justify-start min-w-max overflow-x-scroll scroll-smooth no-scrollbar items-center snap-x rounded-t-2xl border-2 border-slate-400/40 border-dashed bg-indor-black/80 ${
                  isLast ? "border-b-2 rounded-b-2xl" : "border-b-0"
                }`}
              />
            );
          })}
      </div>
    </div>
  );
}

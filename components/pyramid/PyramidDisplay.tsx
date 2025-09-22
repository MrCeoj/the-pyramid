"use client";
import React, { useEffect } from "react";
import PyramidRow from "./PyramidRow";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "react-hot-toast";

type Team = {
  id: number;
  name: string;
  wins: number;
  losses: number;
  status: "winner" | "idle" | "looser" | "risky";
  categoryId: number
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
  userTeamId 
}: { 
  data: PyramidData;
  userTeamId?: number | null; // Pass this from parent component
}) {
  const isMobile = useIsMobile();
  useEffect(() => {
  }, [])
  // Data processing logic remains unchanged
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
                isLast={isLast}
                allPositions={data.positions}
                userTeamId={userTeamId}
                pyramidId={data.pyramid_id!}
              />
            );
          })}
      </div>
    </div>
  );
}
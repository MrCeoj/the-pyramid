"use client";
import React, { useState } from "react";
import PyramidRow from "./PyramidRow";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";

type Team = {
  id: number;
  name: string;
  wins: number;
  losses: number;
};

type Position = {
  id: number;
  row: number;
  col: number;
  team: Team | null;
};

type PyramidData = {
  positions: Position[];
  row_amount: number;
};

const PyramidDisplay: React.FC<{ data: PyramidData }> = ({ data }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const isMobile = useIsMobile();
  // This data processing logic remains unchanged
  const rows: { [key: number]: Position[] } = {};
  data.positions.forEach((pos) => {
    if (!rows[pos.row]) rows[pos.row] = [];
    rows[pos.row].push(pos);
  });

  const filledRows: { [key: number]: Position[] } = {};
  for (let row = 0; row <= data.row_amount; row++) {
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
    <div className="flex flex-col items-center overflow-x-clip">
      {isMobile ? (
        <Image
          src={"/piramide_logo_title_naranja.svg"}
          alt="Logo"
          width={200}
          height={100}
          className=" drop-shadow-slate-700 drop-shadow-[0_0_0.3rem]"
        />
      ) : (
        <>
          <Image
            src="/indor_norte_logo.svg"
            alt="Logo"
            width={400}
            height={200}
            className="fixed top-5 right-7 drop-shadow-slate-700 drop-shadow-[0_0_0.3rem]"
          />
          <Image
            src={"/piramide_logo_title_naranja.svg"}
            alt="Logo"
            width={400}
            height={200}
            className="fixed top-5 left-7 drop-shadow-slate-700 drop-shadow-[0_0_0.3rem]"
          />
        </>
      )}
      <div className="flex flex-col items-center gap-6 ">
        {Object.keys(filledRows)
          .sort((a, b) => Number(a) - Number(b))
          .map((rowKey) => {
            const rowPositions = filledRows[Number(rowKey)];

            // Render the new PyramidRow component for each set of positions
            return (
              <PyramidRow
                key={rowKey}
                positions={rowPositions}
                onTeamClick={(team) => setSelectedTeam(team)}
              />
            );
          })}

        {selectedTeam && (
          <div className="mt-6 bg-white text-gray-800 rounded-lg shadow-lg p-4">
            <h3 className="font-bold mb-2">{selectedTeam.name}</h3>
            <p>
              Wins: {selectedTeam.wins} | Losses: {selectedTeam.losses}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PyramidDisplay;

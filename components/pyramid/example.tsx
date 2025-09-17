"use client";
import React, { useState } from "react";
import PyramidRow from "./PyramidRow";

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
    <div className="flex flex-col items-center gap-6 overflow-x-hidden h-auto">
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
  );
};

export default PyramidDisplay;

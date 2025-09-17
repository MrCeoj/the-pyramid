"use client";
import React, { useState } from "react";

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

const TeamCard: React.FC<{ data: Position; onClick: (team: Team) => void }> = ({
  data,
  onClick,
}) => {
  const winRate: number =
    data.team && data.team.wins + data.team.losses > 0
      ? Number(
          (
            (data.team.wins / (data.team.wins + data.team.losses)) *
            100
          ).toFixed(1)
        )
      : 0;

  return (
    <div
      onClick={() => data.team && onClick(data.team)}
      className="bg-slate-900 rounded-xl border border-slate-700 hover:border-slate-500 hover:shadow-2xl transition-all duration-200 cursor-pointer hover:scale-[1.02] p-4 min-w-[150px] max-w-[170px] backdrop-blur-sm"
    >
      <div className="text-center">
        <div
          className="font-bold text-base text-white truncate mb-3"
          title={data.team?.name}
        >
          {data.team?.name ?? "Unknown"}
        </div>
        {data.team && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-emerald-400 font-medium">
                W: {data.team.wins}
              </span>
              <span className="text-red-400 font-medium">
                L: {data.team.losses}
              </span>
            </div>
            <div className="text-amber-400 font-bold text-lg">{winRate}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

const EmptySlot: React.FC<{ rowNumber: number; posNumber: number }> = ({
  rowNumber,
  posNumber,
}) => {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/30 p-4 min-w-[150px] max-w-[170px] backdrop-blur-sm">
      <div className="text-center">
        <div className="font-semibold text-sm text-slate-400 mb-3">
          Lugar Vacío
        </div>
        <div className="text-xs text-slate-500">
          Fila {rowNumber} • Posición {posNumber}
        </div>
      </div>
    </div>
  );
};

const PyramidDisplay: React.FC<{ data: PyramidData }> = ({ data }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Group positions by row
  const rows: { [key: number]: Position[] } = {};
  data.positions.forEach((pos) => {
    if (!rows[pos.row]) rows[pos.row] = [];
    rows[pos.row].push(pos);
  });

  // Ensure each row has the correct number of columns
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
          id: -1 * (row * 100 + col), // unique negative ID for empty slots
          row,
          col,
          team: null,
        });
      }
    }

    filledRows[row] = filled;
  }

  return (
    <div className="flex flex-col items-center gap-6 overflow-hidden w-screen">
      {Object.keys(filledRows)
        .sort((a, b) => Number(a) - Number(b))
        .map((rowKey) => {
          const rowPositions = filledRows[Number(rowKey)];

          return (
            <div
              key={rowKey}
              className="w-full overflow-x-auto overflow-y-hidden no-scrollbar"
            >
              <div className="flex gap-4 justify-center items-center w-max mx-auto">
                {rowPositions.map((pos) =>
                  pos.team ? (
                    <TeamCard
                      key={pos.id}
                      data={pos}
                      onClick={(team) => setSelectedTeam(team)}
                    />
                  ) : (
                    <EmptySlot
                      key={pos.id}
                      rowNumber={pos.row}
                      posNumber={pos.col}
                    />
                  )
                )}
              </div>
            </div>
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

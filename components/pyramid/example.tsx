"use client";
import React, { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase";

// Type definitions based on your schema
interface Team {
  id: number;
  name: string;
  category_id: string;
  wins: number;
  looses: number;
}

interface Position {
  id: number;
  pyramid_id: number;
  team_id: number;
  row_number: number;
  pos_number: number;
}

interface PositionWithTeam extends Position {
  equipos?: Team;
}

interface PyramidRow {
  rowNumber: number;
  positions: PositionWithTeam[];
}

interface TeamCardProps {
  team: Team;
  position: Position;
  onClick: (team: Team) => void;
}

interface PyramidDisplayProps {
  pyramidId?: number;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, position, onClick }) => {
  const winRate: number =
    team.wins + team.looses > 0
      ? Number(((team.wins / (team.wins + team.looses)) * 100).toFixed(1))
      : 0;

  return (
    <div
      onClick={() => onClick(team)}
      className="bg-white rounded-lg shadow-lg border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 p-3 min-w-[140px] max-w-[160px]"
    >
      <div className="text-center">
        <div
          className="font-bold text-sm text-gray-800 truncate mb-1"
          title={team.name}
        >
          {team.name}
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>W: {team.wins}</span>
            <span>L: {team.looses}</span>
          </div>
          <div className="text-blue-600 font-semibold">{winRate}% WR</div>
          <div className="text-xs text-gray-400">
            Row {position.row_number}, Pos {position.pos_number}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptySlot: React.FC<{ rowNumber: number; posNumber: number }> = ({
  rowNumber,
  posNumber,
}) => {
  return (
    <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-3 min-w-[140px] max-w-[160px] opacity-50">
      <div className="text-center">
        <div className="font-bold text-sm text-gray-400 mb-1">Empty Slot</div>
        <div className="text-xs text-gray-400">
          Row {rowNumber}, Pos {posNumber}
        </div>
      </div>
    </div>
  );
};

const PyramidDisplay: React.FC<PyramidDisplayProps> = ({ pyramidId = 1 }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [pyramidData, setPyramidData] = useState<PyramidRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPyramidData = async (): Promise<void> => {
      const supabase = createSupabaseClient();
      try {
        setLoading(true);
        setError(null);

        // Fetch positions with team data
        const { data: positions, error: fetchError } = await supabase
          .from("posiciones_piramide")
          .select(`*, equipos(*)`)
          .eq("pyramid_id", pyramidId)
          .order("row_number", { ascending: true })
          .order("pos_number", { ascending: true });

        if (fetchError) {
          console.error("Error fetching positions:", fetchError);
          throw fetchError;
        }

        const positionsWithTeams: PositionWithTeam[] = (positions || []).map(
          (pos) => ({
            ...pos,
            equipos: Array.isArray(pos.equipos) ? pos.equipos[0] : pos.equipos,
          })
        );

        // Ensure we have at least 7 rows
        const minRows = 7;
        const maxRowNumber = Math.max(
          minRows,
          Math.max(0, ...positionsWithTeams.map((p) => p.row_number))
        );

        // Group positions by row
        const rowsData: PyramidRow[] = [];

        for (let rowNumber = 1; rowNumber <= maxRowNumber; rowNumber++) {
          const rowPositions = positionsWithTeams.filter(
            (pos) => pos.row_number === rowNumber
          );

          rowsData.push({
            rowNumber,
            positions: rowPositions,
          });
        }

        setPyramidData(rowsData);
      } catch (err) {
        console.error("Error fetching pyramid data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching data"
        );

        // Create empty rows as fallback
        const fallbackRows: PyramidRow[] = Array.from(
          { length: 7 },
          (_, index) => ({
            rowNumber: index + 1,
            positions: [],
          })
        );
        setPyramidData(fallbackRows);
      } finally {
        setLoading(false);
      }
    };

    fetchPyramidData();
  }, [pyramidId]);

  const handleTeamClick = (team: Team): void => {
    setSelectedTeam(team);
  };

  const closeModal = (): void => {
    setSelectedTeam(null);
  };

  const renderRow = (row: PyramidRow) => {
    const { rowNumber, positions } = row;

    // Create a map for quick lookup by pos_number
    const posMap: Record<number, PositionWithTeam | undefined> = {};
    positions.forEach((pos) => {
      posMap[pos.pos_number] = pos;
    });

    // Always render rowNumber slots
    return (
      <div key={rowNumber} className="flex flex-wrap justify-center gap-4">
        {Array.from({ length: rowNumber }, (_, idx) => {
          const posNumber = idx + 1;
          const position = posMap[posNumber];

          if (position && position.equipos) {
            return (
              <TeamCard
                key={`team-${position.id}`}
                team={position.equipos}
                position={position}
                onClick={handleTeamClick}
              />
            );
          } else {
            return (
              <EmptySlot
                key={`empty-${rowNumber}-${posNumber}`}
                rowNumber={rowNumber}
                posNumber={posNumber}
              />
            );
          }
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pyramid data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            The Pyramid
          </h1>
          <p className="text-gray-600 text-lg">
            {error
              ? "Ocurrió un error al cargar los datos. Inténtalo de nuevo más tarde."
              : "Selecciona un equipo para ver detalles"}
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto">
              {error}
            </div>
          )}
        </div>

        {/* Pyramid Display */}
        <div className="flex flex-col items-center space-y-6">
          {pyramidData.map(renderRow)}
        </div>

        {/* Legend */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Legend</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">W:</span> Victorias
            </div>
            <div>
              <span className="font-medium">L:</span> Derrotas
            </div>
            <div>
              <span className="font-medium">WR:</span> Porcentaje de victorias
            </div>
            <div className="text-xs text-gray-500 mt-3">
              Los equipos están posicionados en filas según su rendimiento,
              los espacios vacíos indican posiciones no asignadas.
            </div>
          </div>
        </div>

        {/* Team Detail Modal */}
        {selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedTeam.name}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedTeam.wins}
                    </div>
                    <div className="text-sm text-green-700">Wins</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {selectedTeam.looses}
                    </div>
                    <div className="text-sm text-red-700">Losses</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {selectedTeam.wins + selectedTeam.looses > 0
                        ? (
                            (selectedTeam.wins /
                              (selectedTeam.wins + selectedTeam.looses)) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-blue-700">Ratio de victorias</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 text-center">
                  <div>Category: {selectedTeam.category_id}</div>
                  <div>
                    Total Games: {selectedTeam.wins + selectedTeam.looses}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PyramidDisplay;

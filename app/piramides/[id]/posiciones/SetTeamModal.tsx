import React from "react";
import { X, Users, Trophy, AlertCircle } from "lucide-react";

interface Team {
  id: number;
  categoryId: number | null;
  name: string | null;
  status: "idle" | "winner" | "looser" | "risky" | null;
  wins: number | null;
  losses: number | null;
}

interface SetTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  pyramidId: number;
  rowNumber: number;
  posNumber: number;
  onTeamSelect: (team: Team) => Promise<void>;
  isLoading?: boolean;
}

const SetTeamModal = ({
  isOpen,
  onClose,
  teams,
  pyramidId,
  rowNumber,
  posNumber,
  onTeamSelect,
  isLoading = false,
}: SetTeamModalProps) => {
  if (!isOpen) return null;

  const getStatusColor = (status: Team["status"]) => {
    switch (status) {
      case "winner":
        return "text-green-800 bg-green-200";
      case "looser":
        return "text-red-800 bg-red-200";
      case "risky":
        return "text-yellow-800 bg-yellow-200";
      case "idle":
      default:
        return "text-blue-800 bg-blue-200";
    }
  };

  const getStatusIcon = (status: Team["status"]) => {
    switch (status) {
      case "winner":
        return <Trophy className="w-4 h-4" />;
      case "risky":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: Team["status"]) => {
    switch(status){
        case "winner":
            return "Ganador"
        case "looser":
            return "Perdedor"
        case "idle":
            return "Activo"
        case "risky":
            return "En riesgo"
        default:
            return ""
    }
  }

  const handleTeamClick = async (team: Team) => {
    try {
      await onTeamSelect(team);
      onClose();
    } catch (error) {
      console.error("Error setting team:", error);
      // You might want to add toast notification here
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-indor-black/60 rounded-lg shadow-xl max-w-md border-black border-2 w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold h-full content-center text-white">
            Posicionar equipo en la pirámide
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Position Info */}
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-white">
            <span className="font-medium">Posición:</span> Fila {rowNumber},
            Columna {posNumber}
          </p>
          <p className="text-sm text-white">
            <span className="font-medium">ID de la pirámide:</span> {pyramidId}
          </p>
        </div>

        {/* Teams List */}
        <div className="p-4">
          {teams.length === 0 ? (
            <div className="text-center py-8 text-white">
              <Users className="w-12 h-12 mx-auto mb-3 text-white" />
              <p className="text-sm">No hay más equipos elegibles</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-white mb-3">
                Selecciona un equipo a asignar:
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleTeamClick(team)}
                    disabled={isLoading}
                    className="w-full p-3 rounded-lg bg-indor-black border-black border hover:border-indor-orange hover:bg-indor-brown-light/40 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">
                          {team.name || "Equipo sin nombre"}
                        </h3>
                        <div className="flex items-center mt-1 space-x-4 text-sm text-white/80">
                          <span>Wins: {team.wins || 0}</span>
                          <span>Losses: {team.losses || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center ml-3">
                        <div
                          className={`flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(
                            team.status
                          )}`}
                        >
                          {getStatusIcon(team.status)}
                          <span className="ml-1 capitalize">
                            {getStatusText(team.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t w-full flex justify-center border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-1/2 px-4 py-2 text-sm text-indor-black font-semibold bg-indor-brown-light border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetTeamModal;

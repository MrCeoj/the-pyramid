"use client";
import {
  Trophy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Crown,
} from "lucide-react";
import { MatchWithDetails } from "@/actions/matches/types";

interface HistoryMatchCardData {
  match: MatchWithDetails;
  userTeamId: number;
  formatDate: (date: Date) => string;
}

const HistoryMatchCard = ({
  match,
  formatDate,
  userTeamId,
}: HistoryMatchCardData) => {
  const isWinner = match.winnerTeam?.id === userTeamId;
  console.log(isWinner, match.winnerTeam?.id, userTeamId);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "played":
        return {
          icon: (
            <Trophy
              className={`${isWinner ? "text-green-600" : "text-red-500"}`}
              size={16}
            />
          ),
          label: isWinner ? "Ganado" : "Perdido",
          card: isWinner
            ? "from-indor-black to-green-800/60 border-green-800/80"
            : "from-indor-black to-red-800/60 border-red-500/40",
          labelColor: isWinner ? "text-green-500" : "text-red-500",
        };

      case "accepted":
        return {
          icon: <CheckCircle className="text-blue-400" size={16} />,
          label: "Aceptado",
          card: "from-blue-900/30 to-blue-700/20 border-blue-500/40",
          labelColor: "text-blue-400",
        };
      case "rejected":
        return {
          icon: <XCircle className="text-red-400" size={16} />,
          label: "Rechazado",
          card: "from-red-900/30 to-red-700/20 border-red-500/40",
          labelColor: "text-red-400",
        };
      case "cancelled":
        return {
          icon: <AlertCircle className="text-gray-400" size={16} />,
          label: "Cancelado",
          card: "from-gray-800/40 to-gray-700/20 border-gray-500/40",
          labelColor: "text-gray-400",
        };
      default:
        return {
          icon: <Clock className="text-orange-400" size={16} />,
          label: "Pendiente de respuesta",
          card: "from-orange-900/30 to-orange-700/20 border-orange-500/40",
          labelColor: "text-orange-400",
        };
    }
  };

  const statusInfo = getStatusInfo(match.status);
  const hasWinner = match.winnerTeam && match.status === "played";

  const getTeamStyles = (teamId: number) => {
    const isWinnerTeam = hasWinner && match.winnerTeam?.id === teamId;

    if (!hasWinner) {
      return {
        container: "flex-1 text-center",
        content: "text-white",
        name: "font-semibold",
        category: "text-sm text-slate-300",
      };
    }

    return {
      container: `flex-1 text-center relative ${isWinnerTeam ? "z-10" : ""}`,
      content: isWinnerTeam
        ? "bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-sm shadow-lg shadow-yellow-500/10 transform scale-105 transition-all duration-300"
        : "text-white opacity-75",
      name: isWinnerTeam
        ? "font-bold text-yellow-300 drop-shadow-lg text-lg"
        : "font-semibold",
      category: isWinnerTeam
        ? "text-sm text-yellow-200/80"
        : "text-sm text-slate-300",
    };
  };

  const challengerStyles = getTeamStyles(match.challengerTeam.id);
  const defenderStyles = getTeamStyles(match.defenderTeam.id);

  return (
    <div
      className={`bg-gradient-to-tr backdrop-blur-md rounded-xl p-6 transition-all duration-300 border ${statusInfo.card}`}
    >
      {/* Status row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {statusInfo.icon}
          <span className={`font-medium ${statusInfo.labelColor}`}>
            {statusInfo.label}
          </span>
        </div>
        <span className="text-sm text-white">
          {formatDate(match.createdAt)}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-4 mb-4">
        <div className={challengerStyles.container}>
          <div className={challengerStyles.content}>
            {hasWinner && match.winnerTeam?.id === match.challengerTeam.id && (
              <div className="flex justify-center mb-2">
                <Crown className="text-yellow-400 animate-pulse" size={20} />
              </div>
            )}
            <h4 className={challengerStyles.name}>
              {match.challengerTeam.displayName}
            </h4>
            <p className={challengerStyles.category}>
              Cat. {match.challengerTeam.categoryId}
            </p>
          </div>
        </div>

        <div className="text-lg text-white font-bold px-2">VS</div>

        <div className={defenderStyles.container}>
          <div className={defenderStyles.content}>
            {hasWinner && match.winnerTeam?.id === match.defenderTeam.id && (
              <div className="flex justify-center mb-2">
                <Crown className="text-yellow-400 animate-pulse" size={20} />
              </div>
            )}
            <h4 className={defenderStyles.name}>
              {match.defenderTeam.displayName}
            </h4>
            <p className={defenderStyles.category}>
              Cat. {match.defenderTeam.categoryId}
            </p>
          </div>
        </div>
      </div>

      {/* Pyramid info */}
      <div className="text-center text-md text-white/80 mt-2">
        {match.pyramidName}
      </div>
    </div>
  );
};

export default HistoryMatchCard;

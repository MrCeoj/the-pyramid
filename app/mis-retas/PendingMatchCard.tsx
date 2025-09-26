"use client";
import {
  CheckCircle,
  XCircle,
  Sword,
  Zap,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { MatchWithDetails } from "@/actions/matches/types";

interface PendingMatchCardData {
  match: MatchWithDetails;
  formatDate: (date: Date) => string;
  handleRejectMatch: (matchId: number) => Promise<void>;
  actionLoading: number;
  handleAcceptMatch: (matchId: number) => Promise<void>;
  userTeamId: number; // Added this prop to calculate handicap
}

const PendingMatchCard = ({
  match,
  formatDate,
  handleRejectMatch,
  actionLoading,
  handleAcceptMatch,
  userTeamId,
}: PendingMatchCardData) => {
  // Calculate handicap info
  const userTeam =
    match.defenderTeam.id === userTeamId
      ? match.defenderTeam
      : match.challengerTeam;
  const opponentTeam =
    match.defenderTeam.id === userTeamId
      ? match.challengerTeam
      : match.defenderTeam;
  const categoryDiff = userTeam.categoryId! - opponentTeam.categoryId!;
  const handicapPoints = Math.abs(categoryDiff) * 15;

  const getHandicapInfo = () => {
    if (categoryDiff === 0) {
      return {
        type: "equal",
        message:
          "Ambos equipos están en la misma categoría. ¡Que gane el mejor!",
        icon: <Zap className="text-blue-400" size={20} />,
        bgColor: "from-blue-900/20 to-indigo-900/20",
        borderColor: "border-blue-500/30",
      };
    } else if (categoryDiff > 0) {
      return {
        type: "warning",
        message: `Tu equipo enfrentará un desafío mayor. El rival iniciará con ${handicapPoints} puntos de ventaja en su servicio.`,
        icon: <AlertTriangle className="text-amber-400" size={20} />,
        bgColor: "from-amber-900/20 to-orange-900/20",
        borderColor: "border-amber-500/30",
      };
    } else {
      return {
        type: "advantage",
        message: `¡Tienes ventaja! Tu equipo recibirá ${handicapPoints} puntos adicionales en su servicio.`,
        icon: <TrendingUp className="text-emerald-400" size={20} />,
        bgColor: "from-emerald-900/20 to-green-900/20",
        borderColor: "border-emerald-500/30",
      };
    }
  };

  const handicapInfo = getHandicapInfo();

  return (
    <div className="bg-gradient-to-r from-orange-900/20 via-red-900/10 to-gray-900/20 backdrop-blur-md border-2 border-orange-500/30 rounded-xl p-6 shadow-lg hover:shadow-orange-500/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sword className="text-orange-400" size={20} />
          <h3 className="font-bold text-white">¡Nuevo Desafío!</h3>
        </div>
        <span className="text-sm text-slate-400">
          {formatDate(match.createdAt)}
        </span>
      </div>

      {/* Handicap info */}
      <div
        className={`bg-gradient-to-r ${handicapInfo.bgColor} border ${handicapInfo.borderColor} rounded-lg p-4 mb-6`}
      >
        <div className="flex items-center gap-3 mb-2">
          {handicapInfo.icon}
          <span className="font-semibold text-white">
            {handicapInfo.type === "advantage"
              ? "¡Tienes ventaja!"
              : handicapInfo.type === "warning"
                ? "Desafío mayor"
                : "Partida equilibrada"}
          </span>
        </div>
        <p className="text-sm text-slate-200">{handicapInfo.message}</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 text-center bg-slate-800/50 border border-gray-600/40 p-3 rounded-lg">
          <h4 className="font-semibold text-white">
            {match.challengerTeam.displayName}
          </h4>
          <p className="text-sm text-slate-400">
            Categoría {match.challengerTeam.categoryId}
          </p>
          <span className="text-xs text-orange-300">Retador</span>
        </div>
        <div className="text-2xl text-orange-400">VS</div>
        <div className="flex-1 text-center bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
          <h4 className="font-semibold text-white">
            {match.defenderTeam.displayName}
          </h4>
          <p className="text-sm text-slate-400">
            Categoría {match.defenderTeam.categoryId}
          </p>
          <span className="text-xs text-blue-300">Tu equipo</span>
        </div>
      </div>

      <div className="bg-slate-800/30 p-3 rounded-lg mb-4">
        <p className="text-sm text-slate-300 text-center">
          <strong className="text-white">
            {match.challengerTeam.displayName}
          </strong>{" "}
          te han desafiado en{" "}
          <strong className="text-orange-400">{match.pyramidName}</strong>
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleRejectMatch(match.id)}
          disabled={actionLoading === match.id}
          className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {actionLoading === match.id ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <XCircle size={16} />
              <span>Rechazar</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleAcceptMatch(match.id)}
          disabled={actionLoading === match.id}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25"
        >
          {actionLoading === match.id ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <CheckCircle size={16} />
              <span>Aceptar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PendingMatchCard;

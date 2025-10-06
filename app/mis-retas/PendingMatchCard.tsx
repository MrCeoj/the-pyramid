"use client";
import {
  CheckCircle,
  XCircle,
  Sword,
  Zap,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { MatchWithDetails } from "@/actions/matches/types";

interface PendingMatchCardData {
  match: MatchWithDetails;
  formatDate: (date: Date) => string;
  handleRejectMatch: (matchId: number) => Promise<void>;
  actionLoading: number;
  handleAcceptMatch: (matchId: number) => Promise<void>;
  userTeamId: number;
  rejectedAmount: number;
}

const PendingMatchCard = ({
  match,
  formatDate,
  handleRejectMatch,
  actionLoading,
  handleAcceptMatch,
  userTeamId,
  rejectedAmount,
}: PendingMatchCardData) => {
  const [showRejectModal, setShowRejectModal] = useState(false);

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
    } else if (categoryDiff < 0) {
      return {
        type: "warning",
        message: `Tu equipo enfrentará un desafío mayor. El rival iniciará con ${handicapPoints} puntos de ventaja en cada servicio.`,
        icon: <AlertTriangle className="text-amber-400" size={20} />,
        bgColor: "from-amber-900/20 to-orange-900/20",
        borderColor: "border-amber-500/30",
      };
    } else {
      return {
        type: "advantage",
        message: `¡Tienes ventaja! Tu equipo iniciará con ${handicapPoints} puntos adicionales en cada servicio.`,
        icon: <TrendingUp className="text-emerald-400" size={20} />,
        bgColor: "from-emerald-900/20 to-green-900/20",
        borderColor: "border-emerald-500/30",
      };
    }
  };

  const handicapInfo = getHandicapInfo();

  const handleRejectClick = () => {
    if (rejectedAmount >= 2) {
      setShowRejectModal(true); // open modal instead of blocking
      return;
    }
    handleRejectMatch(match.id);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-orange-900/20 via-red-900/10 to-gray-900/20 backdrop-blur-md border-2 border-orange-500/30 rounded-xl p-6 shadow-lg hover:shadow-orange-500/20 transition-all duration-300">
        {/* Header */}
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

        {/* Teams */}
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

        {/* Challenge text */}
        <div className="bg-slate-800/30 p-3 rounded-lg mb-4">
          <p className="text-sm text-slate-300 text-center">
            <strong className="text-white">
              {match.challengerTeam.displayName}
            </strong>{" "}
            te han desafiado en{" "}
            <strong className="text-orange-400">{match.pyramidName}</strong>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <div className="relative group flex-1">
            <button
              onClick={handleRejectClick}
              disabled={actionLoading === match.id}
              className={`w-full px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
                rejectedAmount >= 2
                  ? "bg-red-900/30 border-2 border-red-500/40 text-red-300 cursor-not-allowed opacity-60"
                  : "bg-red-800/40 hover:bg-red-700/60 border-2 border-red-600/50 hover:border-red-500/70 text-red-200 hover:text-white shadow-lg shadow-red-600/10 hover:shadow-red-600/20 transform hover:scale-[1.02] active:scale-[0.98]"
              } disabled:opacity-50`}
            >
              {actionLoading === match.id ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <XCircle
                    size={16}
                    className={
                      rejectedAmount >= 2 ? "text-red-400" : "text-red-300"
                    }
                  />
                  <span>
                    {rejectedAmount >= 2 ? "Límite alcanzado" : "Rechazar"}
                  </span>
                </>
              )}
            </button>

            {/* Enhanced warning tooltip */}
            {rejectedAmount >= 2 && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-2 text-sm text-white bg-gradient-to-r from-red-900 to-red-800 border border-red-500/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-xl shadow-red-600/30 z-10">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    size={14}
                    className="text-red-300 flex-shrink-0"
                  />
                  <span className="font-medium">
                    Solo puedes rechazar hasta 2 partidos
                  </span>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-800"></div>
              </div>
            )}
          </div>

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

      {/* Mobile modal with warning/punishment styling */}
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="bg-gradient-to-br from-red-900/40 to-red-950/50 border-2 border-red-500/60 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-red-500/30">
            {/* Warning Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-500/20 rounded-full p-3 border border-red-500/40">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-red-300 mb-2 text-center">
              Límite de rechazos alcanzado
            </h2>

            <div className="bg-red-950/30 border border-red-600/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-200 text-center">
                Solo puedes rechazar hasta 2 partidos si no has participado en la semana.
              </p>
            </div>

            <div className="text-center text-xs text-red-300/80 mb-4">
              ⚠️ Utiliza tus rechazos con prudencia
            </div>

            <button
              onClick={() => setShowRejectModal(false)}
              className="w-full px-4 py-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20 border border-red-500/50"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingMatchCard;

"use client";
import { useUsersMatchesStore } from "@/stores/useUsersMatchStore";
import {
  CheckCircle,
  XCircle,
  Sword,
  Zap,
  AlertTriangle,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { useState } from "react";

const PendingMatchCard = ({
  match,
  formatDate,
  handleRejectMatch,
  actionLoading,
  handleAcceptMatch,
  userTeamId,
}: PendingMatchCardData) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const {accept, reject, rejectedAmount} = useUsersMatchesStore()

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
      <div className="relative h-fit bg-slate-800/50 md:max-w-xl max-w-84 w-full self-center backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div
          className="
          pointer-events-none
          absolute -top-24 -left-24
          w-64 h-64
          rounded-full
          blur-3xl
          bg-gradient-to-br from-orange-500/30 to-transparent
        "
        />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-600/20">
              <Sword className="text-orange-400" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Nuevo desafío</h3>
              <p className="text-xs text-slate-400">{match.pyramidName}</p>
            </div>
          </div>
          <span className="text-slate-400 text-sm">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          {/* Attacker Team */}
          <div className="relative p-4 rounded-xl md:col-span-2 border-2 transition-all duration-300 bg-slate-700/30 border-slate-600/50 hover:border-orange-400/50">
            <div className="w-full text-left">
              {/* Team Role Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 bg-orange-600/20 text-orange-300 text-xs font-medium rounded-full border border-orange-500/30">
                  Atacante
                </span>
              </div>

              {/* Team Info */}
              <h4 className="font-bold text-lg text-white mb-2">
                {match.challengerTeam.displayName}
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="text-slate-400" size={14} />
                  <span className="text-slate-300">
                    Fila {match.challengerTeam.currentRow}, Col{" "}
                    {match.challengerTeam.currentCol}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400">
                    {match.challengerTeam.wins}W
                  </span>
                  <span className="text-red-400">
                    {match.challengerTeam.losses}L
                  </span>
                  <span className="text-purple-400">
                    Cat. {match.challengerTeam.categoryId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VS Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-orange-400 mb-2">VS</div>
          </div>

          {/* Defender Team */}
          <div
            className="
            relative p-4 rounded-xl md:col-span-2 border-2 transition-all duration-300
            bg-slate-700/30 border-slate-600/50 hover:border-blue-400/50"
          >
            <div className="w-full text-left">
              {/* Team Role Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                  Defensor
                </span>
              </div>

              {/* Team Info */}
              <h4 className="font-bold text-lg text-white mb-2">
                {match.defenderTeam.displayName}
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="text-slate-400" size={14} />
                  <span className="text-slate-300">
                    Fila {match.defenderTeam.currentRow}, Col{" "}
                    {match.defenderTeam.currentCol}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400">
                    {match.defenderTeam.wins}W
                  </span>
                  <span className="text-red-400">
                    {match.defenderTeam.losses}L
                  </span>
                  <span className="text-purple-400">
                    Cat. {match.defenderTeam.categoryId}
                  </span>
                </div>
              </div>
            </div>
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
                Solo puedes rechazar hasta 2 partidos si no has participado en
                la semana.
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

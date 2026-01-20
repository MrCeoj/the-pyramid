"use client";
import {
  Trophy,
  Crown,
  ArrowUpDown,
  CheckCircle,
  MapPin,
  Calendar,
  ClipboardClock,
  X,
  XCircle,
  Ban,
} from "lucide-react";
import { useAdminMatchesStore } from "@/stores/useAdminMatchesStore";
import { formatDate } from "@/lib/utils";

const MatchCard = ({ match }: { match: MatchWithDetails }) => {
  const {
    cancelingMatch,
    selectedWinner,
    selectWinner,
    completingMatch,
    complete,
  } = useAdminMatchesStore();

  const statusConfig: Record<
    MatchStatus,
    {
      title: string;
      icon: React.ReactNode;
      iconBg: string;
      iconColor: string;
    }
  > = {
    pending: {
      title: "Reta Pendiente",
      icon: <ClipboardClock size={20} />,
      iconBg: "bg-yellow-600/20",
      iconColor: "text-yellow-400",
    },
    accepted: {
      title: "Reta Aceptada",
      icon: <CheckCircle size={20} />,
      iconBg: "bg-green-600/20",
      iconColor: "text-green-400",
    },
    played: {
      title: "Reta Jugada",
      icon: <Trophy size={20} />,
      iconBg: "bg-blue-600/20",
      iconColor: "text-blue-400",
    },
    rejected: {
      title: "Reta Rechazada",
      icon: <XCircle size={20} />,
      iconBg: "bg-red-600/20",
      iconColor: "text-red-400",
    },
    cancelled: {
      title: "Reta Cancelada",
      icon: <Ban size={20} />,
      iconBg: "bg-slate-600/20",
      iconColor: "text-slate-400",
    },
  };

  return (
    <div className="h-fit bg-slate-800/50 md:max-w-xl max-w-84 w-full self-center backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${statusConfig[match.status].iconBg}`}
          >
            <span className={statusConfig[match.status].iconColor}>
              {statusConfig[match.status].icon}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-white">
              {statusConfig[match.status].title}
            </h3>
            <p className="text-sm text-slate-400">{match.pyramidName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-slate-400 flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(match.createdAt)}
            </div>
          </div>
          {/* Cancel button */}
          <button
            disabled={cancelingMatch === match.id}
            className="p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200 group"
            title="Cancelar reta"
          >
            <X className="text-red-400 group-hover:text-red-300" size={16} />
          </button>
        </div>
      </div>

      {/* Teams Battle Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        {/* Challenger Team */}
        <button
          onClick={() => selectWinner(match.id, match.challengerTeam.id)}
          className={`
            relative p-4 rounded-xl md:col-span-2 border-2 transition-all duration-300 cursor-pointer
            ${
              selectedWinner[match.id] === match.challengerTeam.id
                ? "bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-500 shadow-orange-500/20 shadow-lg"
                : "bg-slate-700/30 border-slate-600/50 hover:border-orange-400/50"
            }
          `}
        >
          <div className="w-full text-left">
            {/* Team Role Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-1 bg-orange-600/20 text-orange-300 text-xs font-medium rounded-full border border-orange-500/30">
                Atacante
              </span>
              {selectedWinner[match.id] === match.challengerTeam.id && (
                <Crown className="text-yellow-400" size={20} />
              )}
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
        </button>

        {/* VS Section */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-orange-400 mb-2">VS</div>
          <ArrowUpDown className="text-slate-500" size={24} />
          <div className="text-xs text-slate-500 mt-2 text-center">
            {selectedWinner[match.id] === match.challengerTeam.id && (
              <span className="text-orange-300">
                Posiciones se intercambiarán
              </span>
            )}
            {selectedWinner[match.id] === match.defenderTeam.id && (
              <span className="text-slate-400">Sin cambios de posición</span>
            )}
          </div>
        </div>

        {/* Defender Team */}
        <button
          onClick={() => selectWinner(match.id, match.defenderTeam.id)}
          className={`
            relative p-4 rounded-xl md:col-span-2 border-2 transition-all duration-300 cursor-pointer
            ${
              selectedWinner[match.id] === match.defenderTeam.id
                ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500 shadow-blue-500/20 shadow-lg"
                : "bg-slate-700/30 border-slate-600/50 hover:border-blue-400/50"
            }
          `}
        >
          <div className="w-full text-left">
            {/* Team Role Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                Defensor
              </span>
              {selectedWinner[match.id] === match.defenderTeam.id && (
                <Crown className="text-yellow-400" size={20} />
              )}
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
        </button>
      </div>

      {/* Winner Selection Info */}
      {selectedWinner[match.id] && (
        <div className="bg-slate-700/30 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="text-yellow-400" size={16} />
            <span className="text-white">
              Ganador seleccionado:{" "}
              <strong className="text-yellow-300">
                {selectedWinner[match.id] === match.challengerTeam.id
                  ? match.challengerTeam.displayName
                  : match.defenderTeam.displayName}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(match.status === "accepted" || match.status === "pending") && (
        <div className="flex gap-3">
          <button
            onClick={() => complete(match.id)}
            disabled={!selectedWinner[match.id] || completingMatch === match.id}
            className={`
            flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2
            ${
              selectedWinner[match.id]
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/25"
                : "bg-slate-600/50 text-slate-400 cursor-not-allowed"
            }
              disabled:opacity-50
              `}
          >
            {completingMatch === match.id ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Completar Match</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchCard;

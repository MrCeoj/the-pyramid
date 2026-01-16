"use client";
import {
  Star,
  StarOff,
  CheckCircle,
  Ban,
  AlertCircle,
  Clock,
  Crown,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { cancelMatch } from "@/actions/MatchesActions";
import toast from "react-hot-toast";



const HistoryMatchCard = ({
  match,
  handleCancelMatch,
  formatDate,
  userTeamId,
}: HistoryMatchCardData) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const isWinner = match.winnerTeam?.id === userTeamId;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "played":
        return {
          icon: isWinner ? (
            <Star className={"text-green-600"} size={16} />
          ) : (
            <StarOff className={"text-red-500"} size={16} />
          ),
          labelColor: isWinner ? "text-green-500" : "text-red-500",
          card: isWinner
            ? "from-indor-black to-green-800/60 border-green-800/80"
            : "from-indor-black to-red-800/70 border-red-500",

          label: isWinner ? "Ganado" : "Perdido",
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
          icon: <Ban className="text-red-500" size={16} />,
          label: "Rechazado",
          card: "from-rose-900/30 to-red-900/70 border-red-500/40",
          labelColor: "text-red-500",
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

  const pleaseCancelMatch = async () => {
    setCancelling(true);
    await cancelMatch(match.id)
      .then(() => {
        toast.success("Reta cancelada exitosamente");
        setCancelModalOpen(false);
        setCancelling(false);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Hubo un problema al cancelar la reta, inténtalo de nuevo");
      }).finally(() => handleCancelMatch(match.id));
  };

  const statusInfo = getStatusInfo(match.status);
  const hasWinner = match.winnerTeam && match.status === "played";

  const getTeamStyles = (teamId: number) => {
    const isWinnerTeam = hasWinner && match.winnerTeam?.id === teamId;
    const isUserWin = isWinner;

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
        ? `bg-gradient-to-br animate-pulse ${
            isUserWin
              ? "from-green-500/20 via-emerald-500/10 to-green-600/20 border border-green-500/30"
              : "from-red-500/20 via-rose-500/10 to-red-600/20 border border-red-500/30"
          } rounded-xl p-4 backdrop-blur-sm shadow-lg ${
            isUserWin ? "shadow-yellow-500/20" : "shadow-yellow-500/20"
          } transform scale-105 transition-all duration-300`
        : "text-white opacity-75",
      name: isWinnerTeam
        ? `font-bold ${
            isUserWin ? "text-green-400" : "text-red-300"
          } drop-shadow-lg text-lg`
        : "font-semibold",
      category: isWinnerTeam
        ? `text-sm ${isUserWin ? "text-green-200/80" : "text-red-200/80"}`
        : "text-sm text-slate-300",
    };
  };

  const challengerStyles = getTeamStyles(match.challengerTeam.id);
  const defenderStyles = getTeamStyles(match.defenderTeam.id);

  return (
    <>
      <div
        className={`bg-gradient-to-tr backdrop-blur-md flex flex-col justify-between rounded-xl p-6 transition-all lg:max-w-2/5 lg:min-w-2/5 duration-300 border ${statusInfo.card}`}
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
            {formatDate(match.updatedAt)}
          </span>
        </div>
        {match.status === "accepted" && (
          <div
            onClick={() => setCancelModalOpen(true)}
            className="absolute bottom-4 right-5 text-red-200 rounded-full border border-red-900 bg-red-500 p-1.5 opacity-100 md:opacity-70 cursor-pointer hover:opacity-100"
          >
            <Trash2 size={20} strokeWidth={2} />
          </div>
        )}

        {/* Teams */}
        <div className="flex items-center gap-4 mb-4">
          <div className={challengerStyles.container}>
            <div className={challengerStyles.content}>
              {hasWinner &&
                match.winnerTeam?.id === match.challengerTeam.id && (
                  <div className="flex justify-center mb-2">
                    <Crown className="text-yellow-400" size={20} />
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
                  <Crown
                    className="text-yellow-400 animate-pulse text-shadow-lg text-shadow-amber-400"
                    size={20}
                  />
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
      {/* Mobile modal with warning/punishment styling */}
      {cancelModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-100">
          <div className="bg-gradient-to-br from-red-900/40 to-red-950/50 border-2 border-red-500/60 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-red-500/30">
            {/* Warning Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-500/20 rounded-full p-3 border border-red-500/40">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-red-300 mb-2 text-center">
              Estás por cancelar una reta
            </h2>

            <span className="text-sm text-red-200 text-center flex flex-col items-center">
              ¿Estás seguro de cancelar la reta entre{" "}
              <strong>
                {match.challengerTeam.displayName} VS{" "}
                {match.defenderTeam.displayName}?
              </strong>
            </span>

            <div className="text-center mt-5 text-xs text-red-300/80 mb-4">
              ⚠️ Esta acción no se podrá deshacer
            </div>

            <div className="flex gap-2">
              <button
                disabled={cancelling}
                onClick={pleaseCancelMatch}
                className="w-full px-4 py-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20 border border-red-500/50 disabled:cursor-not-allowed disabled:opacity-20"
              >
                Cancelar la reta
              </button>
              <button
                disabled={cancelling}
                onClick={() => setCancelModalOpen(false)}
                className="w-full px-4 py-3 bg-gray-600/80 hover:bg-gray-600 text-sm text-white rounded-lg font-semibold transition-all duration-200 transform active:scale-95 shadow-lg shadow-red-600/20 border border-slate-500/50 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                Cambié de opinión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryMatchCard;

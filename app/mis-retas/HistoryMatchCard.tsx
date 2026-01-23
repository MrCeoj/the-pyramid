"use client";
import {
  Trophy,
  Crown,
  CheckCircle,
  MapPin,
  Calendar,
  ClipboardClock,
  X,
  XCircle,
  Ban,
} from "lucide-react";

const HistoryMatchCard = ({
  match,
  handleCancelMatch,
  formatDate,
  userTeamId,
}: HistoryMatchCardData) => {
  const defenderWon = match.winnerTeam?.id === match.defenderTeam.id;
  const attackerWon = match.winnerTeam?.id === match.challengerTeam.id;
  const isWinner = match.winnerTeam?.id === userTeamId;

  type VisualStatus = MatchStatus | "played_won" | "played_lost";

  const visualStatus: VisualStatus =
    match.status === "played"
      ? isWinner
        ? "played_won"
        : "played_lost"
      : match.status;

  const statusConfig: Record<
    VisualStatus,
    {
      title: string;
      icon: React.ReactNode;
      iconBg: string;
      iconColor: string;
      glow: string;
    }
  > = {
    pending: {
      title: "Reta Pendiente",
      icon: <ClipboardClock size={20} />,
      iconBg: "bg-orange-600/20",
      iconColor: "text-orange-400",
      glow: "from-orange-500/30",
    },
    accepted: {
      title: "Reta Aceptada",
      icon: <CheckCircle size={20} />,
      iconBg: "bg-green-600/20",
      iconColor: "text-green-400",
      glow: "from-green-500/30",
    },

    played: {
      title: "Reta Jugada",
      icon: <Trophy size={20} />,
      iconBg: "bg-yellow-600/20",
      iconColor: "text-yellow-400",
      glow: "from-yellow-500/30",
    },

    /* 🟢 WON */
    played_won: {
      title: "Victoria",
      icon: <Trophy size={20} />,
      iconBg: "bg-green-600/20",
      iconColor: "text-green-400",
      glow: "from-green-500/40 via-emerald-400/20",
    },

    /* 🔴 LOST */
    played_lost: {
      title: "Derrota",
      icon: <XCircle size={20} />,
      iconBg: "bg-red-600/20",
      iconColor: "text-red-400",
      glow: "from-red-500/40 via-rose-400/20",
    },

    rejected: {
      title: "Reta Rechazada",
      icon: <XCircle size={20} />,
      iconBg: "bg-red-600/20",
      iconColor: "text-red-400",
      glow: "from-red-500/30",
    },
    cancelled: {
      title: "Reta Cancelada",
      icon: <Ban size={20} />,
      iconBg: "bg-slate-600/20",
      iconColor: "text-slate-400",
      glow: "from-white/20",
    },
    voided: {
      title: "Reta Anulada",
      icon: <Ban size={20} />,
      iconBg: "bg-slate-600/20",
      iconColor: "text-slate-400",
      glow: "from-white/20",
    },
    scored: {
      title: "Terminada",
      icon: <Ban size={20} />,
      iconBg: "bg-slate-600/20",
      iconColor: "text-slate-400",
      glow: "from-white/20",
    },
    scoring: {
      title: "Anotando Puntaje...",
      icon: <Ban size={20} />,
      iconBg: "bg-slate-600/20",
      iconColor: "text-slate-400",
      glow: "from-white/20",
    },
  };

  return (
    <div className="relative h-fit bg-slate-800/50 md:max-w-xl max-w-84 w-full self-center backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Status glow */}
      <div
        className={`
          pointer-events-none
          absolute -top-24 -left-24
          w-64 h-64
          rounded-full
          blur-3xl
          bg-gradient-to-br
          ${statusConfig[visualStatus].glow}
          to-transparent
        `}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 w-full">
          <div
            className={`p-2 rounded-lg ${statusConfig[visualStatus].iconBg}`}
          >
            <span className={statusConfig[visualStatus].iconColor}>
              {statusConfig[visualStatus].icon}
            </span>
          </div>
          <div className="w-full">
            <h3 className="font-bold text-white">
              {statusConfig[visualStatus].title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              {match.pyramidName}
            </p>
          </div>
        </div>
        <div className="text-slate-400 flex justify-end items-center gap-1 w-full">
          <Calendar size={14} />
          <span className="text-xs sm:text-sm w-fit">
            {formatDate(match.updatedAt)}
          </span>
        </div>
      </div>

      {/* Teams Battle Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        {/* Challenger Team */}
        <div
          className={`
            relative p-4 rounded-xl md:col-span-2 border-2 transition-all duration-300 cursor-pointer
            ${
              attackerWon
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
              {attackerWon && <Crown className="text-yellow-400" size={20} />}
            </div>

            {/* Team Info */}
            <h4 className="font-bold text-lg text-white mb-2">
              {match.challengerTeam.displayName}
            </h4>

            <div className="space-y-2 text-sm">
              {match.status !== "rejected" && (
                <div className="flex items-center gap-2">
                  <MapPin className="text-slate-400" size={14} />
                  <span className="text-slate-300">
                    Fila {match.challengerTeam.currentRow}, Col{" "}
                    {match.challengerTeam.currentCol}
                  </span>
                </div>
              )}
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
          className={`
            relative p-4 rounded-xl md:col-span-2 border-2 transition-all duration-300
            ${
              defenderWon
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
              {defenderWon && <Crown className="text-yellow-400" size={20} />}
            </div>

            {/* Team Info */}
            <h4 className="font-bold text-lg text-white mb-2">
              {match.defenderTeam.displayName}
            </h4>

            {/* Position infor */}
            <div className="space-y-2 text-sm">
              {match.status !== "rejected" && (
                <div className="flex items-center gap-2">
                  <MapPin className="text-slate-400" size={14} />
                  <span className="text-slate-300">
                    Fila {match.defenderTeam.currentRow}, Col{" "}
                    {match.defenderTeam.currentCol}
                  </span>
                </div>
              )}
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

      {/* Winner Selection Info */}
      {match.winnerTeam && (
        <div className="bg-slate-700/30 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="text-yellow-400" size={16} />
            <span className="text-white">
              Ganadores:{" "}
              <strong className="text-yellow-300">
                {match.winnerTeam.id === match.challengerTeam.id
                  ? match.challengerTeam.displayName
                  : match.defenderTeam.displayName}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(match.status === "accepted" || match.status === "pending") && (
        <div className="flex justify-end gap-3">
          {/* Cancel button */}
          <button
            onClick={() => handleCancelMatch(match.id)}
            className="max-h-16 text-red-400 hover:text-red-300 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 group p-4 text-xs sm:text-sm lg:text-base rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
            title="Cancelar reta"
          >
            <X className="" size={16} />
            <span>Cancelar Reta</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryMatchCard;

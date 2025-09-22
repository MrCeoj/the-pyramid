"use client";
import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Sword,
  AlertCircle,
  History,
  Inbox,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUserMatches,
  acceptMatch,
  rejectMatch,
  MatchWithDetails,
} from "@/actions/MatchesActions";
import toast from "react-hot-toast";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import { useSession } from "next-auth/react";

const MatchesPage = () => {
  const { data } = useSession();
  const user = data?.user
  const [pendingMatches, setPendingMatches] = useState<MatchWithDetails[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  useEffect(() => {
    if (user?.id) {
      fetchMatches();
    }
  }, [user?.id]);

  const fetchMatches = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { pendingMatches, matchHistory } = await getUserMatches(user.id);
      setPendingMatches(pendingMatches);
      setMatchHistory(matchHistory);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Error al cargar los combates");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async (matchId: number) => {
    setActionLoading(matchId);
    try {
      const result = await acceptMatch(matchId);
      if (result.success) {
        toast.success(result.message);
        await fetchMatches(); // Refresh data
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al aceptar el desafío");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectMatch = async (matchId: number) => {
    setActionLoading(matchId);
    try {
      const result = await rejectMatch(matchId);
      if (result.success) {
        toast.success(result.message);
        await fetchMatches(); // Refresh data
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al rechazar el desafío");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "accepted":
        return {
          icon: <CheckCircle className="text-green-400" size={16} />,
          label: "Aceptado",
          color: "text-green-400",
        };
      case "played":
        return {
          icon: <Trophy className="text-yellow-400" size={16} />,
          label: "Jugado",
          color: "text-yellow-400",
        };
      case "rejected":
        return {
          icon: <XCircle className="text-red-400" size={16} />,
          label: "Rechazado",
          color: "text-red-400",
        };
      case "cancelled":
        return {
          icon: <AlertCircle className="text-gray-400" size={16} />,
          label: "Cancelado",
          color: "text-gray-400",
        };
      default:
        return {
          icon: <Clock className="text-orange-400" size={16} />,
          label: "Pendiente",
          color: "text-orange-400",
        };
    }
  };

  const PendingMatchCard = ({ match }: { match: MatchWithDetails }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-orange-900/20 via-red-900/10 to-slate-900/20 backdrop-blur-md border-2 border-orange-500/30 rounded-xl p-6 shadow-lg hover:shadow-orange-500/20 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sword className="text-orange-400" size={20} />
          <h3 className="font-bold text-white">¡Nuevo Desafío!</h3>
        </div>
        <span className="text-sm text-slate-400">
          {formatDate(match.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 text-center bg-slate-800/50 p-3 rounded-lg">
          <h4 className="font-semibold text-white">
            {match.challengerTeam.name}
          </h4>
          <p className="text-sm text-slate-400">
            Categoría {match.challengerTeam.categoryId}
          </p>
          <span className="text-xs text-orange-300">Desafiante</span>
        </div>

        <div className="text-2xl text-orange-400">VS</div>

        <div className="flex-1 text-center bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
          <h4 className="font-semibold text-white">
            {match.defenderTeam.name}
          </h4>
          <p className="text-sm text-slate-400">
            Categoría {match.defenderTeam.categoryId}
          </p>
          <span className="text-xs text-blue-300">Tu equipo</span>
        </div>
      </div>

      <div className="bg-slate-800/30 p-3 rounded-lg mb-4">
        <p className="text-sm text-slate-300 text-center">
          <strong className="text-white">{match.challengerTeam.name}</strong> te
          ha desafiado en{" "}
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
    </motion.div>
  );

  const HistoryMatchCard = ({ match }: { match: MatchWithDetails }) => {
    const statusInfo = getStatusInfo(match.status);
    const isWinner =
      match.winnerTeam?.id === match.defenderTeam.id ||
      match.winnerTeam?.id === match.challengerTeam.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r max-w-[95%] from-indor-black to-indor-brown/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 hover:bg-indor-brown-light/20 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            <span className={`font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <span className="text-sm text-white">
            {formatDate(match.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 text-center">
            <h4 className="font-semibold text-white">
              {match.challengerTeam.name}
            </h4>
            <p className="text-sm text-white">
              Cat. {match.challengerTeam.categoryId}
            </p>
          </div>

          <div className="text-lg text-white">vs</div>

          <div className="flex-1 text-center">
            <h4 className="font-semibold text-white">
              {match.defenderTeam.name}
            </h4>
            <p className="text-sm text-white">
              Cat. {match.defenderTeam.categoryId}
            </p>
          </div>
        </div>

        {match.winnerTeam && (
          <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-500/30 p-3 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="text-yellow-400" size={16} />
              <span className="text-yellow-300 font-medium">
                Ganadores: {match.winnerTeam.name}
              </span>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-slate-400 mt-2">
          {match.pyramidName}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indor-black/80 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-indor-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Cargando combates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-screen bg-indor-black/80 p-4">
      <UserDropdownMenu />
      <div className="max-w-4xl mx-auto flex flex-col">
        {/* Header */}
        <div className="text-center mb-8 mt-6 md:mt-4">
          <h1 className="text-xl font-bold text-white mb-2 md:text-2xl">Mis Combates</h1>
          <p className="text-white text-md md:text-xl">
            Gestiona tus desafíos pendientes y revisa tu historial
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-indor-black border-2 max-w-[95%] min-w-[80%] self-center border-black rounded-xl mb-8">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === "pending"
                ? "bg-indor-orange text-white shadow-lg"
                : "text-white hover:bg-indor-brown"
            }`}
          >
            <Inbox size={18} />
            <span>Pendientes</span>
            {pendingMatches.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingMatches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === "history"
                ? "bg-indor-orange text-white shadow-lg"
                : "text-white hover:bg-indor-brown"
            }`}
          >
            <History size={18} />
            <span>Historial</span>
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "pending" ? (
            <motion.div
              key="pending"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {pendingMatches.length > 0 ? (
                pendingMatches.map((match) => (
                  <PendingMatchCard key={match.id} match={match} />
                ))
              ) : (
                <div className="text-center py-12">
                  <Target className="text-white mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No tienes desafíos pendientes
                  </h3>
                  <p className="text-white">
                    ¡Ve a desafiar a otros equipos en la pirámide!
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {matchHistory.length > 0 ? (
                matchHistory.map((match) => (
                  <HistoryMatchCard key={match.id} match={match} />
                ))
              ) : (
                <div className="text-center py-12">
                  <History className="text-slate-600 mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">
                    No tienes historial de combates
                  </h3>
                  <p className="text-slate-500">
                    Tus combates anteriores aparecerán aquí
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MatchesPage;

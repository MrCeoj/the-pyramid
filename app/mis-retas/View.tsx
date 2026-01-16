"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { History, Inbox, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserMatches, acceptMatch, rejectMatch } from "@/actions/matches";
import toast from "react-hot-toast";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import { useSession } from "next-auth/react";
import PendingMatchCard from "./PendingMatchCard";
import HistoryMatchCard from "./HistoryMatchCard";
import { getUserTeamId } from "@/actions/IndexActions";
import { getRejectedAmount } from "@/actions/matches";
import { usePyramidStore } from "@/stores/usePyramidsStore";

const MatchesPage = () => {
  const { data } = useSession();
  const user = data?.user;
  const [pendingMatches, setPendingMatches] = useState<MatchWithDetails[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [userTeamId, setUserTeamId] = useState<number | null>();
  const [rejectedAmount, setRejectedAmount] = useState<number>(0);
  const { pyramids, selectedPyramidId, setSelectedPyramidId } =
    usePyramidStore();

  const fetchRejectedAmount = useCallback(async () => {
    if (userTeamId === null || userTeamId === undefined) return;

    const amount = await getRejectedAmount(userTeamId);
    if (amount === null || amount === undefined)
      throw new Error(
        "Error al conseguir cantidad de partidas rechazadas. Null"
      );
    if (typeof amount !== "number")
      throw new Error(
        "Error al conseguir cantidad de partidas rechazadas. Error"
      );

    setRejectedAmount(amount);
  }, [userTeamId]);

  const filteredPendingMatches = useMemo(() => {
    if (!selectedPyramidId) return pendingMatches;
    return pendingMatches.filter((m) => m.pyramidId === selectedPyramidId);
  }, [pendingMatches, selectedPyramidId]);

  const filteredMatchHistory = useMemo(() => {
    if (!selectedPyramidId) return matchHistory;
    return matchHistory.filter((m) => m.pyramidId === selectedPyramidId);
  }, [matchHistory, selectedPyramidId]);

  const fetchMatches = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { pendingMatches, matchHistory } = await getUserMatches(user.id);
      const utid = await getUserTeamId(user.id);
      setPendingMatches(pendingMatches);
      setMatchHistory(matchHistory);
      if ("error"! in utid) return;
      setUserTeamId(utid.teamId);
      await fetchRejectedAmount();
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Error al cargar los combates");
    } finally {
      setLoading(false);
    }
  }, [fetchRejectedAmount, user?.id]);

  // Single useEffect for initial data fetching
  useEffect(() => {
    if (user?.id) {
      fetchMatches();
    }
  }, [user?.id, fetchMatches]);

  const handleAcceptMatch = async (matchId: number) => {
    if (actionLoading || !user?.id) return; // Prevent multiple calls

    setActionLoading(matchId);
    try {
      const result = await acceptMatch(matchId, user.id);
      if (result.success) {
        toast.success(result.message);
        await fetchMatches(); // Refresh data
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      if (error instanceof Error) toast.error("Error al aceptar el desafío");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelMatch = useCallback(
    async (matchId: number) => {
      if (actionLoading || !user?.id) return;

      setActionLoading(matchId);
      await fetchMatches().then(() => setActionLoading(null));
    },
    [actionLoading, fetchMatches, user?.id]
  );

  const handleRejectMatch = async (matchId: number) => {
    if (actionLoading || !user?.id) return;

    setActionLoading(matchId);
    try {
      const result = await rejectMatch(matchId, user.id);
      if (result.success) {
        toast.success(result.message);
        await fetchMatches();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      if (error instanceof Error) toast.error("Error al rechazar el desafío");
    } finally {
      setActionLoading(null);
    }
  };

  // Memoize the formatDate function
  const formatDate = useMemo(() => {
    return (date: Date) => {
      return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date));
    };
  }, []);

  if (loading && !pendingMatches.length && !matchHistory.length) {
    return (
      <div className="min-h-screen bg-indor-black/80 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-indor-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Cargando retas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-screen bg-indor-black/80 p-4">
      <UserDropdownMenu />
      <div className="max-w-6xl mx-auto h-screen no-scrollbar pb-10 flex flex-col overflow-y-scroll">
        {/* Header */}
        <div className="text-center mb-8 mt-6 md:mt-4">
          <h1 className="text-xl font-bold text-white mb-2 md:text-2xl">
            Mis Retas
          </h1>
          <p className="text-white text-md md:text-xl">
            Gestiona tus retas pendientes y revisa tu historial
          </p>
        </div>

        {/* Pyramid filter */}
        <div className="max-w-6xl mb-6 flex justify-end">
          <div className="max-w-sm flex items-center justify-end gap-3">
            <label className="text-white text-sm whitespace-nowrap">
              Filtrar por pirámide:
            </label>
            <select
              value={selectedPyramidId ?? ""}
              onChange={(e) =>
                setSelectedPyramidId(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className="flex-1 bg-indor-black border border-indor-brown text-white max-w-xs min-w-xs rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {pyramids.map((pyramid) => (
                <option key={pyramid.id} value={pyramid.id}>
                  {pyramid.name}
                </option>
              ))}
            </select>
          </div>
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
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {filteredPendingMatches.length > 0 ? (
                filteredPendingMatches.map((match) => (
                  <PendingMatchCard
                    key={match.id}
                    match={match}
                    userTeamId={userTeamId!}
                    handleAcceptMatch={handleAcceptMatch}
                    handleRejectMatch={handleRejectMatch}
                    formatDate={formatDate}
                    actionLoading={actionLoading!}
                    rejectedAmount={rejectedAmount}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Target className="text-white mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No tienes retas pendientes
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
              initial={{ opacity: 1, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 flex flex-col items-center"
            >
              {filteredMatchHistory.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 w-full flex flex-col lg:flex-row flex-wrap justify-center gap-5 sm:w-full"
                >
                  {filteredMatchHistory.map((match) => (
                    <HistoryMatchCard
                      key={match.id}
                      handleCancelMatch={handleCancelMatch}
                      userTeamId={userTeamId!}
                      match={match}
                      formatDate={formatDate}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-center py-12"
                >
                  <History className="text-white mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No tienes historial de retas
                  </h3>
                  <p className="text-white">
                    Tus retas anteriores aparecerán aquí
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}{" "}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MatchesPage;

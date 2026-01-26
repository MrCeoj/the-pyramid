"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { History, Inbox, Target, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import { useSession } from "next-auth/react";
import PendingMatchCard from "./PendingMatchCard";
import HistoryMatchCard from "./HistoryMatchCard";
import { usePyramidStore } from "@/stores/usePyramidsStore";
import { formatDate } from "@/lib/utils";
import { useUsersMatchesStore } from "@/stores/useUsersMatchStore";
import ScoringModal from "@/components/ui/ScoringModal";

const MatchesPage = () => {
  const {
    loading,
    actionLoading,
    userTeamId,
    fetchMatches,
    scoringModal,
    selectedScoringMatch,
    toggleModal,
    accept,
    reject,
    cancel,
    score,
    filtered,
    rejectedAmount,
  } = useUsersMatchesStore();

  const { data } = useSession();
  const userId = data?.user?.id;

  const { pyramids, selectedPyramidId, setSelectedPyramidId } =
    usePyramidStore();

  const [activeTab, setActiveTab] = useState<"active" | "pending" | "history">(
    "pending",
  );

  useEffect(() => {
    if (userId) fetchMatches(userId);
  }, [userId, fetchMatches]);

  const activeMatches = filtered.active(selectedPyramidId);
  const pendingMatches = filtered.pending(selectedPyramidId);
  const historyMatches = filtered.history(selectedPyramidId);

  if (loading) {
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
          <div className="max-w-sm flex flex-wrap items-center justify-end gap-3">
            <label className="text-white text-sm">Filtrar por pirámide:</label>
            <select
              value={selectedPyramidId ?? ""}
              onChange={(e) =>
                setSelectedPyramidId(
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              className="flex-1 bg-indor-black border border-indor-brown text-white w-fit rounded-lg px-3 py-2 text-sm"
            >
              {pyramids.map((pyramid) => (
                <option key={pyramid.id} value={pyramid.id}>
                  {pyramid.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-indor-black border-2 max-w-dvw min-w-[80%] self-center border-black rounded-xl mb-8 text-xs sm:text-sm md:text-base">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "active"
                ? "bg-indor-orange text-white shadow-lg"
                : "text-white hover:bg-indor-brown"
            }`}
          >
            <CheckCircle className="hidden sm:block" size={18} />
            <CheckCircle className="block sm:hidden" size={14} />
            <span>Activas</span>
            {activeMatches.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                {activeMatches.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "pending"
                ? "bg-indor-orange text-white shadow-lg"
                : "text-white hover:bg-indor-brown"
            }`}
          >
            <Inbox className="hidden sm:block" size={18} />
            <Inbox className="block sm:hidden" size={14} />
            <span>Pendientes</span>
            {pendingMatches.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                {pendingMatches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "history"
                ? "bg-indor-orange text-white shadow-lg"
                : "text-white hover:bg-indor-brown"
            }`}
          >
            <History className="hidden sm:block" size={18} />
            <History className="block sm:hidden" size={14} />
            <span>Historial</span>
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 1, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 flex flex-col items-center"
            >
              {activeMatches.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 w-full flex flex-col lg:flex-row flex-wrap justify-center gap-5 sm:w-full"
                >
                  {activeMatches.map((match) => (
                    <HistoryMatchCard
                      key={match.id}
                      handleCancelMatch={() => cancel(match.id, userId!)}
                      handleStartScoring={() => toggleModal(match.id)}
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
          )}
          {activeTab === "pending" && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 flex flex-col"
            >
              {pendingMatches.length > 0 ? (
                pendingMatches.map((match) => (
                  <PendingMatchCard
                    key={match.id}
                    match={match}
                    userTeamId={userTeamId!}
                    handleAcceptMatch={() => accept(match.id, userId!)}
                    handleRejectMatch={() => reject(match.id, userId!)}
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
          )}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 1, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 flex flex-col items-center"
            >
              {historyMatches.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 w-full flex flex-col lg:flex-row flex-wrap justify-center gap-5 sm:w-full"
                >
                  {historyMatches.map((match) => (
                    <HistoryMatchCard
                      key={match.id}
                      handleCancelMatch={() => cancel(match.id, userId!)}
                      handleStartScoring={() => toggleModal(match.id)}
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

      <ScoringModal scoringMatch={selectedScoringMatch!} open={scoringModal}/>
    </div>
  );
};

export default MatchesPage;

"use client";
import { useEffect } from "react";
import { Swords, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminMatchesStore } from "@/stores/useAdminMatchesStore";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import MatchCard from "@/components/ui/AdminMatchCard";
import MatchDateFilter from "@/components/ui/MatchDateFilter";
import MatchStatusFilter from "@/components/ui/MatchStatusFilter";
import MatchPyramidFilter from "@/components/ui/MatchPyramidFilter";

const AdminMatchesPage = () => {
  const {
    filteredMatches,
    fetchMatches,
    loading,
    fetchPyramids,
    selectedPyramid,
  } = useAdminMatchesStore();

  useEffect(() => {
    fetchPyramids();
  }, []);

  useEffect(() => {
    if (selectedPyramid) fetchMatches(selectedPyramid.id);
  }, [selectedPyramid]);

  if (loading) {
    return (
      <div className="min-h-screen max-w-screen backdrop-blur-lg bg-indor-black/80 flex items-center justify-center">
        <UserDropdownMenu />
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Cargando retas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh max-h-dvh max-w-dvw overflow-y-scroll bg-indor-black/80 p-4 relative ">
      <UserDropdownMenu />
      <div className="flex flex-col justify-center mt-2">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-b-indor-brown-light/80">
          <div className="p-2 bg-gradient-to-br from-indor-orange to-amber-600 via-amber-400 rounded-full">
            <Swords className="text-white" size={20} />
          </div>
          <h1 className="text-xl md:text-3xl font-bold text-white ">
            Gestión de retas
          </h1>
        </div>

        <div className="flex flex-wrap mb-6 justify-between items-start">
          <MatchStatusFilter />
          <MatchPyramidFilter />
          <MatchDateFilter />
        </div>

        {/* Matches List */}
        <AnimatePresence>
          {filteredMatches.length > 0 ? (
            <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 w-full justify-items-center">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <AlertCircle className="text-white mx-auto mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay retas entre jugadores en{" "}
                <strong>{selectedPyramid?.name}</strong>.
              </h3>
              <p className="text-white">
                Las retas aparecerán aquí cuando los equipos acepten desafíos
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminMatchesPage;

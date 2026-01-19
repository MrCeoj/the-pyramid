"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Swords,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";
import { useAdminMatchesStore } from "@/stores/useAdminMatchesStore";
import { MatchCard } from "@/components/ui/AdminMatchCard";

const AdminMatchesPage = () => {
  const { matches, fetchMatches, loading, fetchPyramids, selectedPyramid } =
    useAdminMatchesStore();

  const isMobile = useIsMobile();

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
    <div className="min-h-screen max-h-screen max-w-screen overflow-y-scroll bg-indor-black/80 p-4 relative ">
      <UserDropdownMenu />
      {createPortal(
        <button
          onClick={() => fetchMatches(selectedPyramid!.id)}
          disabled={loading}
          className={`${
            isMobile ? "bottom-5 right-5" : "top-5 right-10"
          } z-50 fixed text-white rounded-full bg-indor-orange cursor-pointer p-2 transition-all duration-100 hover:scale-105 hover:bg-orange-400 disabled:animate-spin `}
        >
          <RefreshCw
            className={loading ? "animate-spin" : ""}
            size={20}
            strokeWidth={3}
          />
        </button>,
        document.body,
      )}
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

        {/* Stats */}
        <div className="max-w-6xl self-center grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-400" size={24} />
              <div>
                <p className="text-2xl font-bold text-white">
                  {matches.length}
                </p>
                <p className="text-sm text-white">Retas Pendientes</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Users className="text-blue-400" size={24} />
              <div>
                <p className="text-2xl font-bold text-white">
                  {matches.length * 2}
                </p>
                <p className="text-sm text-white">Equipos Involucrados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Matches List */}
        <AnimatePresence>
          {matches.length > 0 ? (
            <div className="space-y-6 w-full flex flex-col items-center">
              {matches.map((match) => (
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
                No hay retas aceptadas entre jugadores.
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

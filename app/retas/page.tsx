"use client";
import React, { useState, useEffect } from "react";
import {
  Swords,
  Trophy,
  Crown,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  Calendar,
  Users,
  X,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAcceptedMatches,
  completeMatch,
  cancelMatch,
} from "@/actions/matches/";
import { AcceptedMatchWithDetails } from "@/actions/matches/types";
import toast from "react-hot-toast";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";

const AdminMatchesPage = () => {
  const [matches, setMatches] = useState<AcceptedMatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingMatch, setCompletingMatch] = useState<number | null>(null);
  const [cancelingMatch, setCancelingMatch] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(
    null
  );
  const [selectedWinner, setSelectedWinner] = useState<{
    [matchId: number]: number;
  }>({});

  const isMobile = useIsMobile();

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    console.log(matches);
  }, [matches]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const acceptedMatches = await getAcceptedMatches();
      setMatches(acceptedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Error al cargar las retas");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMatch = async (matchId: number) => {
    const winnerTeamId = selectedWinner[matchId];

    if (!winnerTeamId) {
      toast.error("Por favor selecciona un ganador");
      return;
    }
    console.log(winnerTeamId);
    setCompletingMatch(matchId);
    try {
      const result = await completeMatch(matchId, winnerTeamId);
      console.log(result);
      if (result.success) {
        toast.success(result.message);
        await fetchMatches(); // Refresh the list
        // Clear the selected winner
        setSelectedWinner((prev) => {
          const newState = { ...prev };
          delete newState[matchId];
          return newState;
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      if (error instanceof Error) {
      }
      toast.error("Error al completar el match");
    } finally {
      setCompletingMatch(null);
    }
  };

  const handleCancelMatch = async (matchId: number) => {
    setCancelingMatch(matchId);
    try {
      const result = await cancelMatch(matchId);
      if (result.success) {
        toast.success("Reta cancelada exitosamente");
        await fetchMatches();
        setSelectedWinner((prev) => {
          const newState = { ...prev };
          delete newState[matchId];
          return newState;
        });
      } else {
        toast.error(result.message || "Error al cancelar la reta");
      }
    } catch (error) {
      console.error("Error canceling match:", error);
      toast.error("Error al cancelar la reta");
    } finally {
      setCancelingMatch(null);
      setShowCancelConfirm(null);
    }
  };

  const handleWinnerSelection = (matchId: number, teamId: number) => {
    setSelectedWinner((prev) => ({
      ...prev,
      [matchId]: teamId,
    }));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const ConfirmCancelDialog = ({
    matchId,
    match,
  }: {
    matchId: number;
    match: AcceptedMatchWithDetails;
  }) => {
    if (showCancelConfirm !== matchId) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCancelConfirm(null)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-600/20 rounded-lg">
              <AlertCircle className="text-red-400" size={20} />
            </div>
            <h3 className="font-bold text-white">Cancelar Reta</h3>
          </div>

          <p className="text-slate-300 mb-6">
            ¿Estás seguro de que quieres cancelar la reta entre{" "}
            <strong className="text-white">
              {match.challengerTeam.displayName}
            </strong>{" "}
            y{" "}
            <strong className="text-white">
              {match.defenderTeam.displayName}
            </strong>
            ?
          </p>

          <p className="text-sm text-slate-400 mb-6">
            Esta acción no se puede deshacer y la reta cambiará su estado a
            &quot;cancelado&quot;.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCancelConfirm(null)}
              className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-medium"
            >
              Mantener Reta
            </button>
            <button
              onClick={() => handleCancelMatch(matchId)}
              disabled={cancelingMatch === matchId}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cancelingMatch === matchId ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={16} />
                  Cancelar Reta
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  };

  const MatchCard = ({ match }: { match: AcceptedMatchWithDetails }) => {
    const winner = selectedWinner[match.id];
    const attackerSelected = winner === match.challengerTeam.id;
    const defenderSelected = winner === match.defenderTeam.id;

    return (
      <div className="bg-slate-800/50 max-w-6xl w-84 md:w-auto self-center backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <CheckCircle className="text-green-400" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Reta Aceptada</h3>
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
              onClick={() => setShowCancelConfirm(match.id)}
              disabled={cancelingMatch === match.id}
              className="p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200 group"
              title="Cancelar reta"
            >
              <X className="text-red-400 group-hover:text-red-300" size={16} />
            </button>
          </div>
        </div>

        {/* Teams Battle Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Challenger Team */}
          <div
            className={`
            relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
            ${
              attackerSelected
                ? "bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-500 shadow-orange-500/20 shadow-lg"
                : "bg-slate-700/30 border-slate-600/50 hover:border-orange-400/50"
            }
          `}
          >
            <button
              onClick={() =>
                handleWinnerSelection(match.id, match.challengerTeam.id)
              }
              className="w-full text-left"
            >
              {/* Team Role Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 bg-orange-600/20 text-orange-300 text-xs font-medium rounded-full border border-orange-500/30">
                  Atacante
                </span>
                {attackerSelected && (
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
            </button>
          </div>

          {/* VS Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-orange-400 mb-2">VS</div>
            <ArrowUpDown className="text-slate-500" size={24} />
            <div className="text-xs text-slate-500 mt-2 text-center">
              {winner === match.challengerTeam.id && (
                <span className="text-orange-300">
                  Posiciones se intercambiarán
                </span>
              )}
              {winner === match.defenderTeam.id && (
                <span className="text-slate-400">Sin cambios de posición</span>
              )}
            </div>
          </div>

          {/* Defender Team */}
          <div
            className={`
            relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
            ${
              defenderSelected
                ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500 shadow-blue-500/20 shadow-lg"
                : "bg-slate-700/30 border-slate-600/50 hover:border-blue-400/50"
            }
          `}
          >
            <button
              onClick={() =>
                handleWinnerSelection(match.id, match.defenderTeam.id)
              }
              className="w-full text-left"
            >
              {/* Team Role Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                  Defensor
                </span>
                {defenderSelected && (
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
            </button>
          </div>
        </div>

        {/* Winner Selection Info */}
        {winner && (
          <div className="bg-slate-700/30 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="text-yellow-400" size={16} />
              <span className="text-white">
                Ganador seleccionado:{" "}
                <strong className="text-yellow-300">
                  {winner === match.challengerTeam.id
                    ? match.challengerTeam.displayName
                    : match.defenderTeam.displayName}
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleCompleteMatch(match.id)}
            disabled={!winner || completingMatch === match.id}
            className={`
              flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2
              ${
                winner
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

        <ConfirmCancelDialog matchId={match.id} match={match} />
      </div>
    );
  };

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
          onClick={fetchMatches}
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
        document.body
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

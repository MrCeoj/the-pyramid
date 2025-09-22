"use client";
import { Sword, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { createMatch } from "@/actions/MatchesActions";
import { createPortal } from "react-dom";

interface Team {
  id: number;
  name: string | null;
  categoryId: number | null;
  wins: number | null;
  losses: number | null;
}

interface ChallengeModalProps {
  isOpen: boolean;
  attacker: Team | null;
  defender: Team | null;
  pyramidId: number;
  onClose: () => void;
}

export default function ChallengeModal({
  isOpen,
  attacker,
  defender,
  pyramidId,
  onClose,
}: ChallengeModalProps) {
  if (!isOpen || !attacker || !defender) return null;

  const categoryDiff = (defender.categoryId ?? 0) - (attacker.categoryId ?? 0);
  const handicapPoints = Math.abs(categoryDiff) * 15;

  let message = "";
  let messageColor = "text-slate-300";

  if (categoryDiff > 0) {
    message = `Este enfrentamiento es riesgoso. Tu equipo tendrá un handicap de ${handicapPoints} puntos.`;
    messageColor = "text-red-400";
  } else if (categoryDiff < 0) {
    message = `¡Tu equipo se beneficiará de un handicap de ${handicapPoints} puntos en este enfrentamiento!`;
    messageColor = "text-emerald-400";
  }

  const handleConfirm = async () => {
    await createMatch({
      pyramidId,
      challengerTeamId: attacker.id,
      defenderTeamId: defender.id,
    });
    onClose();
  };

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 z-50">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="bg-indor-black/80 text-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full relative border border-black"
          >
            <h2 className="text-2xl font-extrabold text-center mb-8 tracking-wide">
              ⚔️ ¡Desafío en la Pirámide!
            </h2>

            {/* Teams VS Layout */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 mb-8">
              <div className="flex-1 text-center bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-inner">
                <h3 className="font-bold text-lg">{attacker.name || "Equipo sin nombre"}</h3>
                <p className="text-sm text-slate-400">
                  Categoría {attacker.categoryId}
                </p>
                <div className="flex justify-center gap-4 mt-2 text-sm">
                  <span className="text-emerald-400">W: {attacker.wins}</span>
                  <span className="text-red-400">L: {attacker.losses}</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <Swords size={40} className="text-orange-500 drop-shadow-lg" />
                <span className="text-xs text-slate-400 mt-1">VS</span>
              </div>

              <div className="flex-1 text-center bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-inner">
                <h3 className="font-bold text-lg">{defender.name || "Equipo sin nombre"}</h3>
                <p className="text-sm text-slate-400">
                  Categoría {defender.categoryId}
                </p>
                <div className="flex justify-center gap-4 mt-2 text-sm">
                  <span className="text-emerald-400">W: {defender.wins}</span>
                  <span className="text-red-400">L: {defender.losses}</span>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <p className={`text-center mb-6 font-semibold ${messageColor}`}>
                {message}
              </p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all shadow-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-md"
              >
                <Sword size={18} /> Confirmar
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}

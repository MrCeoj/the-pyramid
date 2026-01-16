"use client";
import { Sword, X, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { createMatch } from "@/actions/matches/";
import { createPortal } from "react-dom";
import { Swords } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface ChallengeModalProps {
  isOpen: boolean;
  attacker: TeamWithPlayers | null;
  defender: TeamWithPlayers | null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  if (!attacker || !defender) return null;

  const categoryDiff = (defender.categoryId ?? 0) - (attacker.categoryId ?? 0);
  const handicapPoints = Math.abs(categoryDiff) * 15;

  const getHandicapInfo = () => {
    if (categoryDiff === 0) {
      return {
        type: "equal",
        message:
          "Ambos equipos están en la misma categoría. ¡Que gane el mejor!",
        icon: <Zap className="text-blue-400" size={20} />,
        bgColor: "from-blue-900/20 to-indigo-900/20",
        borderColor: "border-blue-500/30",
      };
    } else if (categoryDiff > 0) {
      return {
        type: "warning",
        message: `Tu equipo enfrentará un desafío mayor. El rival iniciará con ${handicapPoints} puntos de ventaja en cada servicio.`,
        icon: <AlertTriangle className="text-amber-400" size={20} />,
        bgColor: "from-amber-900/20 to-orange-900/20",
        borderColor: "border-amber-500/30",
      };
    } else {
      return {
        type: "advantage",
        message: `¡Tienes ventaja! Tu equipo iniciará con ${handicapPoints} puntos adicionales en cada servicio.`,
        icon: <TrendingUp className="text-emerald-400" size={20} />,
        bgColor: "from-emerald-900/20 to-green-900/20",
        borderColor: "border-emerald-500/30",
      };
    }
  };

  const handicapInfo = getHandicapInfo();

  const handleConfirm = async () => {
    if (!session?.user?.id) {
      toast.error(
        "Hubo un error al procesar tu solicitud, intentalo de nuevo."
      );
      await onClose()
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createMatch({
        pyramidId,
        challengerTeamId: attacker.id,
        defenderTeamId: defender.id,
        userId: session?.user.id,
      });

      if (!result.success) {
        toast.error(result.error || "Error al crear el desafío");
        await onClose()
        return;
      }

      if (result.success && result.emailSent === false) {
        toast.success(
          "¡Reta creada! Pero no se pudo notificar al equipo defensor.",
          { duration: 5000 }
        );
      } else {
        toast.success("¡Has desafiado al equipo! Espera su respuesta.", {
          duration: 5000,
        });
      }

      await onClose();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      await onClose()
      toast.error("Error inesperado al crear el desafío");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TeamCard = ({
    team,
    isAttacker,
  }: {
    team: TeamWithPlayers;
    isAttacker: boolean;
  }) => (
    <div
      className={`
      relative overflow-hidden
      bg-gradient-to-br ${
        isAttacker
          ? "from-orange-900/20 via-red-900/10 to-slate-900/20 border-orange-500/30"
          : "from-slate-900/40 via-slate-800/20 to-slate-900/40 border-slate-500/30"
      }
      backdrop-blur-md
      border-2 rounded-2xl
      p-6 flex-1
      transition-all duration-300
      ${isAttacker ? "shadow-orange-500/20" : "shadow-slate-500/10"}
      shadow-lg
    `}
    >
      {/* Team indicator */}
      <div
        className={`
        absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold
        ${
          isAttacker
            ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
            : "bg-slate-600/20 text-slate-300 border border-slate-500/30"
        }
      `}
      >
        {isAttacker ? "Atacante" : "Defensor"}
      </div>

      <div className="text-center mt-4">
        <h3 className="font-bold text-xl mb-2 text-white/95 leading-tight">
          {team.displayName}
        </h3>

        <div className="mb-4">
          <div
            className={`
            inline-block px-3 py-1 rounded-full text-sm font-medium
            bg-gradient-to-r from-purple-500/20 to-blue-500/20
            border border-purple-400/30 text-purple-200
          `}
          >
            Categoría {team.categoryId}
          </div>
        </div>

        <div className="flex justify-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {team.wins || 0}
            </div>
            <div className="text-xs text-emerald-300/70 font-medium uppercase tracking-wider">
              Victorias
            </div>
          </div>

          <div className="w-px bg-slate-600"></div>

          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {team.losses || 0}
            </div>
            <div className="text-xs text-red-300/70 font-medium uppercase tracking-wider">
              Derrotas
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isOpen &&
        createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-indor-black/95 backdrop-blur-xl text-white max-h-[95%] overflow-scroll no-scrollbar rounded-3xl shadow-2xl max-w-4xl w-full relative border border-slate-700/50"
            >
              {/* Header */}
              <div className="relative p-8 pb-6">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>

                <div className="text-center">
                  <div className="inline-flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                      <Swords className="text-white" size={24} />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    ¡Desafío en puerta!
                  </h2>
                  <p className="text-slate-400 mt-2">
                    Confirma tu desafío contra el equipo rival
                  </p>
                </div>
              </div>

              {/* Teams Battle Section */}
              <div className="px-8 pb-6">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-8">
                  <TeamCard team={attacker} isAttacker={true} />

                  {/* VS Section */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="text-6xl font-extrabold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent md:mb-2"
                    >
                      VS
                    </motion.div>
                    <div className="w-12 h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
                  </div>

                  <TeamCard team={defender} isAttacker={false} />
                </div>
              </div>

              {/* Handicap Information */}
              {handicapInfo && (
                <div className="mx-8 mb-6">
                  <div
                    className={`
                      bg-gradient-to-r ${handicapInfo.bgColor}
                      border ${handicapInfo.borderColor}
                      rounded-xl p-4
                      backdrop-blur-sm
                      `}
                  >
                    <div className="flex items-start gap-3">
                      {handicapInfo.icon}
                      <div>
                        <h4 className="font-semibold text-white mb-1">
                          {handicapInfo.type === "warning"
                            ? "Desafío Arriesgado"
                            : handicapInfo.type === "advantage"
                            ? "Ventaja Táctica"
                            : "Combate Equilibrado"}
                        </h4>
                        <p className="text-sm text-slate-300">
                          {handicapInfo.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 p-8 pt-0">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/25"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sword size={18} />
                      <span className="font-semibold">Confirmar Desafío</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      I
    </>
  );
}

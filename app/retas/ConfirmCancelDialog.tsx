import { createPortal } from "react-dom";
import { motion } from "framer-motion";

export function ConfirmCancelDialog({
  match,
  isLoading,
  onConfirm,
  onClose,
}: {
  match: MatchWithDetails | null;
  isLoading: boolean;
  onConfirm: (matchId: number) => void;
  onClose: () => void;
}) {
  if (!match) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl"
      >
        <h3 className="text-white font-bold mb-4">Cancelar Reta</h3>

        <p className="text-slate-300 mb-6">
          ¿Cancelar la reta entre{" "}
          <strong>{match.challengerTeam.displayName}</strong> y{" "}
          <strong>{match.defenderTeam.displayName}</strong>?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 rounded-xl py-3"
          >
            Mantener
          </button>

          <button
            disabled={isLoading}
            onClick={() => onConfirm(match.id)}
            className="flex-1 bg-red-600 rounded-xl py-3 disabled:opacity-50"
          >
            {isLoading ? "Cancelando..." : "Cancelar"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

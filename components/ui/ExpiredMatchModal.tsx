"use client";

import { AlertTriangle } from "lucide-react";

export default function ExpiredMatchesModal({ 
  isOpen, 
  onClose
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-red-900/30 to-red-950/40 border-2 border-red-500/60 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20">
        {/* Warning Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-500/20 rounded-full p-3 border border-red-500/40">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Title with danger styling */}
        <h3 className="text-xl font-bold text-red-300 mb-6 text-center flex items-center justify-center gap-2">
          ¡PENALIZACIÓN APLICADA!
        </h3>

        <div className="text-gray-200 space-y-4">
          <div className="bg-red-950/30 border border-red-600/30 rounded-lg p-4">
            <p className="text-center">
              Por no responder a una reta a tiempo, tu equipo ha sido
              <span className="font-bold text-red-400 px-2 py-1">
                reubicado una posición atrás
              </span>
              en la pirámide.
            </p>
          </div>
          
          <div className="text-center text-sm text-red-300/80 bg-red-950/20 p-3 rounded border border-red-600/20">
            ⚠️ Responde más rápido la próxima vez para evitar penalizaciones
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20 border border-red-500/50"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
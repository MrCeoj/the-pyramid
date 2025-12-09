"use client";
import { FC } from "react";

interface InactivePyramidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InactivePyramidModal: FC<InactivePyramidModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-indor-black/60 rounded-xl px-6 py-8 max-w-sm text-center shadow-xl border-1 border-black">
        <h2 className="text-2xl font-bold mb-4 text-white ">
          Pirámide Inactiva
        </h2>
        <p className="text-gray-200 mb-6 text-sm">
          No puedes jugar en esta pirámide porque se encuentra desactivada. ¡Pero aún puedes ver las posiciones!
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-indor-orange/80 text-white font-semibold rounded-lg hover:bg-indor-orange transition"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default InactivePyramidModal;
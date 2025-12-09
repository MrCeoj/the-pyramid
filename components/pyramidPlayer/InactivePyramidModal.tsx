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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl px-6 py-8 max-w-sm text-center shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-red-600">
          Pirámide Inactiva
        </h2>
        <p className="text-gray-700 mb-6">
          No puedes jugar en esta pirámide porque se encuentra inactiva.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default InactivePyramidModal;
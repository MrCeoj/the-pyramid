"use client";
import { useState } from "react";
import { Edit, Eye, ChartNoAxesColumn } from "lucide-react";
import { EditPyramidModal } from "./EditPyramidModal";
import { useRouter } from "next/navigation";
import { RiskyTeamsChecker } from "./RiskyTeamChecker";

interface Pyramid {
  id: number;
  name: string;
  description: string | null;
  row_amount: number | null;
  active: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface PyramidCardProps {
  pyramid: Pyramid;
}

export function PyramidCard({ pyramid }: PyramidCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();

  const handleView = () => {
    router.push(`/piramides/${pyramid.id}`);
  };

  const handlePositions = () => {
    router.push(`/piramides/${pyramid.id}/posiciones`);
  };

  return (
    <>
      <div className="bg-indor-black/80 rounded-lg shadow-md border border-black p-6 hover:shadow-lg flex flex-col justify-between 1transition-shadow">
        <RiskyTeamsChecker pyramidId={pyramid.id} />
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">
              {pyramid.name}
            </h3>
            {pyramid.description ? (
              <p className="text-white/80 text-sm mb-3 line-clamp-2">
                {pyramid.description}
              </p>
            ) : (
              <p className="text-white/80 text-sm mb-3 line-clamp-2">
                Sin descripción
              </p>
            )}
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium border-2 ${
              pyramid.active
                ? "bg-green-500/50 text-white border-green-900"
                : "bg-red-500/50 text-white border-red-900"
            }`}
          >
            {pyramid.active ? "Activa" : "Inactiva"}
          </div>
        </div>

        <div className="text-sm text-white/80 mb-4">
          <div>Cantidad de Filas: {pyramid.row_amount || 1}</div>
          <div>Creado: {pyramid.createdAt?.toLocaleDateString()}</div>
        </div>

        <div className="flex self-end justify-end space-x-2">
          <button
            onClick={handleView}
            className="p-2 text-blue-600 hover:bg-indor-brown-light rounded-full transition-colors"
            title="Ver pirámide"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={handlePositions}
            className="p-2 text-indor-orange hover:bg-indor-brown-light rounded-full transition-colors"
            title="Posiciones"
          >
            <ChartNoAxesColumn size={18} strokeWidth={5} />
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 text-white hover:bg-indor-brown-light rounded-full transition-colors"
            title="Editar"
          >
            <Edit size={18} />
          </button>
        </div>
      </div>

      <EditPyramidModal
        pyramid={pyramid}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  );
}

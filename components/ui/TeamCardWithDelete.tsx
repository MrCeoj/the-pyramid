"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import TeamCard from "@/components/ui/TeamCardEdit";
import { removeTeamFromPosition } from "@/actions/PositionActions";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { TeamWithPlayers } from "@/actions/PositionActions";

interface Position {
  id: number;
  row: number;
  col: number;
  team: TeamWithPlayers | null;
}

interface TeamCardWithDeleteProps {
  data: Position;
  onTeamClick: (team: TeamWithPlayers) => void;
  pyramidId: number;
}

const TeamCardWithDelete: React.FC<TeamCardWithDeleteProps> = ({
  data,
  onTeamClick,
  pyramidId,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  

  const handleDeleteConfirmed = async () => {
    setIsDeleting(true);
    setShowConfirm(false);

    try {
      const result = await removeTeamFromPosition(data.id, pyramidId);

      if (!result.success) {
        throw new Error(result.error || "Failed to remove team");
      }

      toast.success("Equipo quitado exitosamente");
    } catch (error) {
      console.error("Error removing team:", error);
      toast.error("Error al remover equipo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTeamClick = () => {
    if (data.team && !isDeleting) {
      onTeamClick(data.team);
    }
  };

  return (
    <div className="relative group">
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isDeleting) setShowConfirm(true);
        }}
        disabled={isDeleting}
        className="absolute -top-2 -right-2 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        aria-label="Remove team"
      >
        {isDeleting ? (
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <X className="w-3 h-3" />
        )}
      </button>
      {/* Team card */}
      <div onClick={handleTeamClick} className="cursor-pointer">
        <TeamCard data={data} />
      </div>
      {showConfirm &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-opacity-50 z-50">
            <div className="bg-indor-black/60 rounded-lg p-6 border-2 border-black shadow-lg max-w-sm w-full">
              <p className="mb-4 text-lg text-white text-center font-semibold">
                ¿Deseas remover este equipo de la pirámide?
              </p>
              <div className="w-full flex justify-center mb-4">
              <TeamCard data={data}/>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleDeleteConfirmed}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 font-semibold cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1 border rounded text-sm bg-indor-brown-light font-semibold hover:bg-indor-brown-light/60 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default TeamCardWithDelete;

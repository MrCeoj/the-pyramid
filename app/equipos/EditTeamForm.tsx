import { useState } from "react";
import {
  TeamWithPlayers,
  updateTeamPlayers,
  updateTeam,
} from "@/actions/TeamsActions";
import PlayerSearchBar from "./PlayerSearchbar";
import toast from "react-hot-toast";
import { Save, X } from "lucide-react";

type Category = { id: number; name: string };
type Player = {
  id: string;
  name: string | null;
  paternalSurname: string | null;
  nickname: string | null;
  email: string | null;
};

const EditTeamForm = ({
  teamData,
  onCancel,
  onEditModalClose,
  availablePlayers,
  categories,
  setError,
}: {
  teamData: TeamWithPlayers;
  onCancel: () => void;
  onEditModalClose: () => Promise<void>;
  availablePlayers: Player[];
  categories: Category[];
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const [formData, setFormData] = useState({
    categoryId: teamData.category!.id,
    status: teamData.team.status || "idle",
    player1Id: teamData.team.player1Id || "",
    player2Id: teamData.team.player2Id || "",
    defended: teamData.team.defendable || false,
    lastResult: teamData.team.lastResult || "stayed",
    loosingStreak: teamData.team.loosingStreak || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.player1Id && !formData.player2Id) {
      setError("Un equipo debe tener al menos un jugador.");
      return;
    }
    if (formData.player1Id && formData.player1Id === formData.player2Id) {
      setError("Los jugadores no pueden ser la misma persona.");
      return;
    }
    updateTeamData(teamData.team.id, teamData, formData);
  };

  const updateTeamData = async (
    teamId: number,
    originalData: TeamWithPlayers,
    updatedData: {
      categoryId: number;
      status: "idle" | "risky" | "winner" | "looser";
      player1Id: string;
      player2Id: string;
      defended: boolean;
      lastResult: "up" | "down" | "stayed" | "none";
      loosingStreak: number;
    }
  ) => {
    const promises = [];

    if (
      originalData.team.categoryId !== updatedData.categoryId ||
      originalData.team.status !== updatedData.status ||
      originalData.team.lastResult !== updatedData.lastResult ||
      originalData.team.defendable !== updatedData.defended ||
      originalData.team.loosingStreak !== updatedData.loosingStreak
    ) {
      promises.push(
        updateTeam(teamId, {
          categoryId: updatedData.categoryId,
          status: updatedData.status,
          lastResult: updatedData.lastResult,
          defendable: updatedData.defended,
          loosingStreak: updatedData.loosingStreak,
        })
      );
    }

    if (
      originalData.team.player1Id !== updatedData.player1Id ||
      originalData.team.player2Id !== updatedData.player2Id
    ) {
      promises.push(
        updateTeamPlayers(teamId, {
          player1Id: updatedData.player1Id,
          player2Id: updatedData.player2Id,
        })
      );
    }

    if (promises.length === 0) {
      onEditModalClose();
    }

    try {
      await Promise.all(promises);
      toast.success("Equipo actualizado exitosamente!");
      onEditModalClose();
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error updating team:", err);
        setError(err.message || "Error al editar equipo, inténtelo de nuevo.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center border-b border-black p-4">
        <h1 className="text-2xl font-bold">{teamData.displayName}</h1>
        <span className="text-sm text-gray-300">
          TeamID: {teamData.team.id}
        </span>
      </div>
      <div className="px-4 space-y-4">
        {/* Player selectors */}
        <PlayerSearchBar
          label="Jugador 1"
          players={availablePlayers}
          selectedPlayerId={formData.player1Id}
          onSelectPlayer={(id) => setFormData({ ...formData, player1Id: id })}
          disabledPlayerIds={[formData.player2Id].filter(Boolean)}
        />
        <PlayerSearchBar
          label="Jugador 2"
          players={availablePlayers}
          selectedPlayerId={formData.player2Id}
          onSelectPlayer={(id) => setFormData({ ...formData, player2Id: id })}
          disabledPlayerIds={[formData.player1Id].filter(Boolean)}
        />

        <div className="flex justify-between p">
          {/* Category */}
          <div className="w-5/12">
            <label className="block mb-1 text-sm font-medium text-white">
              Categoría
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-white border border-gray-600 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indor-orange"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Losing streak */}
          <div className="w-1/2">
            <label className="block mb-1 text-sm font-medium text-white">
              Racha de derrotas
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.loosingStreak}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setFormData({
                  ...formData,
                  loosingStreak: value === "" ? 0 : Number(value),
                });
              }}
              onFocus={(e) => {
                if (e.target.value === "0") {
                  e.target.select();
                }
              }}
              className="w-full px-3 py-2 text-white border border-gray-600 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indor-orange"
            />
          </div>
        </div>

        <div className="flex justify-between">
          {/* Status */}
          <div className="w-5/12">
            <label className="block mb-1 text-sm font-medium text-white">
              Estado actual
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as
                    | "looser"
                    | "winner"
                    | "idle"
                    | "risky",
                })
              }
              className="w-full px-3 py-2 text-white border border-gray-600 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indor-orange"
            >
              <option value="idle">Neutral</option>
              <option value="winner">Ganador</option>
              <option value="looser">Perdedor</option>
              <option value="risky">En riesgo</option>
            </select>
          </div>

          {/* Last result */}
          <div className="w-1/2">
            <label className="block mb-1 text-sm font-medium text-white">
              Último movimiento
            </label>
            <select
              value={formData.lastResult}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lastResult: e.target.value as
                    | "up"
                    | "down"
                    | "stayed"
                    | "none",
                })
              }
              className="w-full px-3 py-2 text-white border border-gray-600 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indor-orange"
            >
              <option value="up">Subió</option>
              <option value="down">Bajó</option>
              <option value="stayed">Se mantuvo</option>
              <option value="none">Ninguno</option>
            </select>
          </div>
        </div>

        {/* Defended checkbox */}
        <div className="flex items-center gap-2 pt-2 px-1.5 w-full">
          <input
            type="checkbox"
            id="defended"
            checked={formData.defended}
            onChange={(e) =>
              setFormData({ ...formData, defended: e.target.checked })
            }
            className="w-5 h-5 border-gray-600 focus:ring-indor-orange accent-emerald-600"
          />
          <label htmlFor="defended" className="text-md font-medium text-white">
            Con escudo
          </label>
        </div>
      </div>
      {/* Buttons */}
      <div className="flex justify-end gap-6 px-6 py-4 border-t border-black">
        <button
          type="submit"
          className="flex items-center gap-1 px-3 py-1 text-sm text-white rounded bg-indor-orange/80 hover:bg-indor-orange"
        >
          <Save size={14} /> Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-gray-500 rounded hover:bg-gray-600"
        >
          <X size={14} /> Cancelar
        </button>
      </div>
    </form>
  );
};

export default EditTeamForm;

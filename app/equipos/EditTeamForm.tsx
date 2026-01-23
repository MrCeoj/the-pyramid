import { useState } from "react";
import { updateTeamPlayers, updateTeam } from "@/actions/TeamsActions";
import PlayerSearchBar from "./PlayerSearchbar";
import toast from "react-hot-toast";
import { Save, X } from "lucide-react";

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
    categoryId: teamData.categoryId,
    player1Id: teamData.player1?.id || "",
    player2Id: teamData.player2?.id || "",
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
    updateTeamData(teamData.id, teamData, formData);
  };

  const updateTeamData = async (
    teamId: number,
    originalData: TeamWithPlayers,
    updatedData: {
      categoryId: number | null;
      player1Id: string;
      player2Id: string;
    },
  ) => {
    const promises = [];

    if (originalData.categoryId !== updatedData.categoryId) {
      promises.push(
        updateTeam(teamId, {
          categoryId: updatedData.categoryId!,
        }),
      );
    }

    if (
      originalData.player1?.id !== updatedData.player1Id ||
      originalData.player2?.id !== updatedData.player2Id
    ) {
      promises.push(
        updateTeamPlayers(teamId, {
          player1Id: updatedData.player1Id,
          player2Id: updatedData.player2Id,
        }),
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
        <span className="text-sm text-gray-300">TeamID: {teamData.id}</span>
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
              value={formData.categoryId!}
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

import { useState } from "react";
import { TeamWithPlayers } from "@/actions/TeamsActions";
import PlayerSearchBar from "./PlayerSearchbar";
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
  onSave,
  onCancel,
  availablePlayers,
  categories,
  setError,
}: {
  teamData: TeamWithPlayers;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  availablePlayers: Player[];
  categories: Category[];
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const [formData, setFormData] = useState({
    categoryId: teamData.category!.id,
    status: teamData.team.status || "idle",
    player1Id: teamData.team.player1Id || "",
    player2Id: teamData.team.player2Id || "",
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
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div>
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
      <div>
        <label className="block mb-1 text-sm font-medium text-white">
          Estado
        </label>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData({
              ...formData,
              status: e.target.value as "looser" | "winner" | "idle" | "risky",
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
      <div className="flex gap-2 pt-2">
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

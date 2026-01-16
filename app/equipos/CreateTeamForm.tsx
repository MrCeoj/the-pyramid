import { useState } from "react"
import PlayerSearchBar from "./PlayerSearchbar";
import {Save, X} from "lucide-react"

type Category = { id: number; name: string };
type Player = {
  id: string;
  name: string | null;
  paternalSurname: string | null;
  nickname: string | null;
  email: string | null;
};

const CreateTeamForm = ({
  onSubmit,
  onCancel,
  categories,
  teams,
  allPlayers,
  setError,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  categories: Category[];
  allPlayers: Player[];
  teams: TeamWithPlayers[]
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const [formData, setFormData] = useState({
    player1Id: "",
    player2Id: "",
    categoryId: categories[0]?.id.toString() || "",
  });

  // Players that are already in any team
  const assignedPlayerIds = teams
    .flatMap((t) => [t.player1?.id, t.player2?.id])
    .filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.player1Id && !formData.player2Id) {
      setError("Por favor seleccione al menos un jugador.");
      return;
    }
    if (!formData.categoryId) {
      setError("Por favor seleccione una categoría.");
      return;
    }
    if (formData.player1Id && formData.player1Id === formData.player2Id) {
      setError("Los jugadores no pueden ser la misma persona.");
      return;
    }
    onSubmit({
      ...formData,
      categoryId: parseInt(formData.categoryId),
    });
  };

  return (
    <div className="p-6 bg-indor-black">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Crear nuevo equipo</h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-gray-400 rounded-md hover:text-white hover:bg-gray-700"
        >
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PlayerSearchBar
          label="Jugador 1"
          players={allPlayers}
          selectedPlayerId={formData.player1Id}
          onSelectPlayer={(id) => setFormData({ ...formData, player1Id: id })}
          disabledPlayerIds={[...assignedPlayerIds, formData.player2Id].filter(
            Boolean
          )}
        />
        <PlayerSearchBar
          label="Jugador 2"
          players={allPlayers}
          selectedPlayerId={formData.player2Id}
          onSelectPlayer={(id) => setFormData({ ...formData, player2Id: id })}
          disabledPlayerIds={[...assignedPlayerIds, formData.player1Id].filter(
            Boolean
          )}
        />
        <div>
          <label className="block mb-1 text-sm font-medium text-white">
            Categoría
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
            className="w-full px-3 py-2 text-white border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indor-orange"
          >
            {categories.map((cat) => (
              <option className="bg-gray-800" key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="flex items-center justify-center flex-1 gap-2 px-4 py-2 text-white transition-colors rounded-md bg-indor-orange/80 hover:bg-indor-orange"
          >
            <Save size={16} /> Crear equipo
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center justify-center flex-1 gap-2 px-4 py-2 text-white transition-colors bg-gray-600 rounded-md hover:bg-gray-500"
          >
            <X size={16} /> Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTeamForm;

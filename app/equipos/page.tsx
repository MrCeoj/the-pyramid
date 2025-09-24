"use client";
import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit, Users, Save, X, Trash2 } from "lucide-react";

// Import your rewritten API functions and types
import {
  getTeams,
  getCategories,
  getPlayers,
  createTeam,
  updateTeam,
  updateTeamPlayers, // Import the new function
  deleteTeam, // Import the delete function
  TeamWithPlayers,
} from "@/actions/TeamsActions"; // Update this path
import toast from "react-hot-toast";

// Define types for state clarity
type Category = { id: number; name: string };
type Player = {
  id: string;
  name: string | null;
  paternalSurname: string | null;
  nickname: string | null;
  email: string | null;
};

// A new reusable search bar component for selecting players
const PlayerSearchBar = ({
  label,
  players,
  selectedPlayerId,
  onSelectPlayer,
  disabledPlayerIds = [],
}: {
  label: string;
  players: Player[];
  selectedPlayerId: string;
  onSelectPlayer: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disabledPlayerIds?: any[];
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter players based on search term, excluding disabled players
  const filteredPlayers = searchTerm
    ? players.filter(
        (player) =>
          !disabledPlayerIds.includes(player.id) &&
          (`${player.name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const handleSelect = (playerId: string) => {
    onSelectPlayer(playerId);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    onSelectPlayer(""); // Clear selection by passing an empty string
  };

  return (
    <div ref={searchContainerRef} className="relative">
      <label className="block text-sm font-medium text-white mb-1">
        {label}
      </label>
      {selectedPlayer ? (
        <div className="flex items-center justify-between w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700">
          <span className="text-white">
            {selectedPlayer.nickname || `${selectedPlayer.name}`}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Buscar por nombre, apodo o correo..."
            className="w-full px-3 py-2 text-white bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indor-orange"
          />
          {isDropdownOpen && searchTerm && (
            <ul className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
                  <li
                    key={player.id}
                    onClick={() => handleSelect(player.id)}
                    className="px-4 py-2 text-white cursor-pointer hover:bg-gray-700"
                  >
                    {player.nickname || `${player.name}`}{" "}
                    <span className="text-sm text-gray-400">
                      ({player.email})
                    </span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-400">
                  No se hayaron jugadores
                </li>
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

// Modal wrapper component (no changes needed)
const Modal = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 backdrop-blur-lg bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const TeamManagement = () => {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null); // Reset error after showing
    }
  }, [error]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsData, categoriesData, playersData] = await Promise.all([
        getTeams(),
        getCategories(),
        getPlayers(),
      ]);

      setTeams(teamsData);
      setCategories(categoriesData);
      setAllPlayers(playersData as Player[]); // Store all players
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error loading data:", err);
        setError(
          err.message || "Error al cargar los datos. Inténtelo de nuevo."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (formData: {
    player1Id: string;
    player2Id: string;
    categoryId: number;
  }) => {
    try {
      await createTeam(formData);
      toast.success("Equipo creado exitosamente!");
      await loadData();
      setShowCreateForm(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error creating team:", err);
        setError(err.message || "Error al crear equipo. Inténtelo de nuevo.");
      }
    }
  };

  // NEW: Combined handler for updating all aspects of a team
  const handleUpdateTeam = async (
    teamId: number,
    originalData: TeamWithPlayers,
    updatedData: {
      categoryId: number;
      status: "idle" | "risky" | "winner" | "looser";
      player1Id: string;
      player2Id: string;
    }
  ) => {
    const promises = [];

    // Check if category or status changed
    if (
      originalData.team.categoryId !== updatedData.categoryId ||
      originalData.team.status !== updatedData.status
    ) {
      promises.push(
        updateTeam(teamId, {
          categoryId: updatedData.categoryId,
          status: updatedData.status,
        })
      );
    }

    // Check if players changed
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
      setEditingTeam(null); // Nothing changed, just close the form
      return;
    }

    try {
      await Promise.all(promises);
      toast.success("Equipo actualizado exitosamente!");
      await loadData();
      setEditingTeam(null);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error updating team:", err);
        setError(err.message || "Failed to update team. Please try again.");
      }
    }
  };

  // NEW: Handler for deleting a team
  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (
      window.confirm(`¿Estás seguro de que quieres eliminar el equipo "${teamName}"?`)
    ) {
      try {
        await deleteTeam(teamId);
        toast.success(`Equipo "${teamName}" eliminado.`);
        await loadData();
      } catch (err) {
        if (err instanceof Error) {
          console.error("Error deleting team:", err);
          setError(err.message || "Failed to delete team.");
        }
      }
    }
  };

  // CreateTeamForm (no changes needed)
  const CreateTeamForm = ({
    onSubmit,
    onCancel,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      player1Id: "",
      player2Id: "",
      categoryId: categories[0]?.id.toString() || "",
    });
    
    // Players that are already in any team
    const assignedPlayerIds = teams.flatMap(t => [t.team.player1Id, t.team.player2Id]).filter(Boolean);

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
          <button type="button" onClick={onCancel} className="p-1 text-gray-400 rounded-md hover:text-white hover:bg-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PlayerSearchBar
            label="Jugador 1"
            players={allPlayers}
            selectedPlayerId={formData.player1Id}
            onSelectPlayer={(id) => setFormData({ ...formData, player1Id: id })}
            disabledPlayerIds={[...assignedPlayerIds, formData.player2Id].filter(Boolean)}
          />
          <PlayerSearchBar
            label="Jugador 2"
            players={allPlayers}
            selectedPlayerId={formData.player2Id}
            onSelectPlayer={(id) => setFormData({ ...formData, player2Id: id })}
            disabledPlayerIds={[...assignedPlayerIds, formData.player1Id].filter(Boolean)}
          />
          <div>
            <label className="block mb-1 text-sm font-medium text-white">Categoría</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
            <button type="submit" className="flex items-center justify-center flex-1 gap-2 px-4 py-2 text-white transition-colors rounded-md bg-indor-orange/80 hover:bg-indor-orange">
              <Save size={16} /> Crear equipo
            </button>
            <button type="button" onClick={onCancel} className="flex items-center justify-center flex-1 gap-2 px-4 py-2 text-white transition-colors bg-gray-600 rounded-md hover:bg-gray-500">
              <X size={16} /> Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  };
  
  // UPDATED EditTeamForm
  const EditTeamForm = ({
    teamData,
    onSave,
    onCancel,
    availablePlayers,
  }: {
    teamData: TeamWithPlayers;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
    availablePlayers: Player[];
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
          <label className="block mb-1 text-sm font-medium text-white">Categoría</label>
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
          <label className="block mb-1 text-sm font-medium text-white">Estado</label>
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
          <button type="submit" className="flex items-center gap-1 px-3 py-1 text-sm text-white rounded bg-indor-orange/80 hover:bg-indor-orange">
            <Save size={14} /> Guardar
          </button>
          <button type="button" onClick={onCancel} className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-gray-500 rounded hover:bg-gray-600">
            <X size={14} /> Cancelar
          </button>
        </div>
      </form>
    );
  };
  
  const statusColors: { [key: string]: string } = {
    idle: "bg-gray-500 text-white",
    winner: "bg-green-500 text-white",
    looser: "bg-red-500 text-white",
    risky: "bg-yellow-500 text-black",
  };

  const PlayerDisplay = ({ player }: { player: TeamWithPlayers["player1"] }) =>
    player ? (
      <div className="font-medium">
        {player.profile?.nickname || `${player.user.name}`}
        <div className="text-sm text-gray-400">{player.user.email}</div>
      </div>
    ) : (
      <div className="text-gray-500 italic">Jugador no asignado</div>
    );

  return (
    <div className="min-h-screen p-6 mx-auto text-white bg-indor-black/60">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestión de equipos</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-white transition-colors duration-75 rounded-md bg-indor-orange/80 hover:bg-indor-orange"
        >
          <Plus size={20} /> Crear equipo
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Cargando equipos...</div>
      ) : (
        <>
          <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)}>
            <CreateTeamForm onSubmit={handleCreateTeam} onCancel={() => setShowCreateForm(false)} />
          </Modal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((teamData) => {
              // NEW: Calculate available players for THIS specific team edit form
              const assignedPlayerIds = teams
                .flatMap((t) => [t.team.player1Id, t.team.player2Id])
                .filter(Boolean);
              
              const currentTeamPlayers = [teamData.team.player1Id, teamData.team.player2Id].filter(Boolean);

              const availablePlayersForEdit = allPlayers.filter(
                p => !assignedPlayerIds.includes(p.id) || currentTeamPlayers.includes(p.id)
              );

              return (
                <div key={teamData.team.id} className="flex flex-col justify-between p-5 border border-gray-700 rounded-lg bg-indor-black">
                  {editingTeam === teamData.team.id ? (
                    <EditTeamForm
                      teamData={teamData}
                      onSave={(data) => handleUpdateTeam(teamData.team.id, teamData, data)}
                      onCancel={() => setEditingTeam(null)}
                      availablePlayers={availablePlayersForEdit}
                    />
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{teamData.displayName}</h3>
                          <span className="text-sm text-gray-400">{teamData.category?.name || "No Category"}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[teamData.team.status!]}`}>
                          {teamData.team.status}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        <PlayerDisplay player={teamData.player1} />
                        <PlayerDisplay player={teamData.player2} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-700">
                    <button onClick={() => setEditingTeam(teamData.team.id)} className="p-2 text-gray-400 rounded-md hover:text-white hover:bg-gray-700">
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(teamData.team.id, teamData.displayName)}
                      className="p-2 text-gray-400 rounded-md hover:text-red-500 hover:bg-gray-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {!loading && teams.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-lg bg-indor-black">
                <Users size={48} className="mx-auto mb-4 text-gray-500" />
                <h3 className="mb-2 text-lg font-medium text-white">No se encontraron equipos.</h3>
                <p className="mb-4 text-gray-400">Inicia creando uno.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 text-white transition-all duration-75 rounded-md bg-indor-orange/80 hover:bg-indor-orange"
                >
                  <div className="flex items-center gap-1">
                    <Plus size={16} /> Crear equipo
                  </div>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeamManagement;
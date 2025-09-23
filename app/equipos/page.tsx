"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Users,
  UserPlus,
  UserMinus,
  Save,
  X,
} from "lucide-react";

// Import your API functions
import {
  getTeams,
  getCategories,
  getPlayers,
  createTeam,
  updateTeam,
  addPlayerToTeam,
  removePlayerFromTeam,
} from "@/actions/TeamsActions"; // Update this path

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

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
      setAllPlayers(playersData);

      // Filter available players (those not in any team)
      const available = playersData.filter((player) => !player.profile?.teamId);
      setAvailablePlayers(available);

      setError(null);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error al cargar equipos, inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    idle: "bg-gray-100 text-gray-800",
    winner: "bg-green-100 text-green-800",
    looser: "bg-red-100 text-red-800",
    risky: "bg-yellow-100 text-yellow-800",
  };

  const handleCreateTeam = async (formData) => {
    try {
      const newTeam = await createTeam({
        name: formData.name,
        categoryId: parseInt(formData.categoryId),
        status: formData.status,
      });

      // Reload data to get updated teams with proper joins
      await loadData();
      setShowCreateForm(false);
    } catch (err) {
      console.error("Error creating team:", err);
      setError("Failed to create team. Please try again.");
    }
  };

  const handleUpdateTeam = async (teamId, updatedData) => {
    try {
      await updateTeam(teamId, {
        name: updatedData.name,
        categoryId: parseInt(updatedData.categoryId),
        status: updatedData.status,
      });

      // Reload data to get updated information
      await loadData();
      setEditingTeam(null);
    } catch (err) {
      console.error("Error updating team:", err);
      setError("Failed to update team. Please try again.");
    }
  };

  const handleAddPlayerToTeam = async (teamId, playerId) => {
    try {
      await addPlayerToTeam(teamId, playerId);
      await loadData(); // Reload to update the UI
      setShowPlayerModal(null);
    } catch (err) {
      console.error("Error adding player to team:", err);
      setError(
        err.message || "Error al agregar jugador al equipo."
      );
    }
  };

  const handleRemovePlayerFromTeam = async (playerId) => {
    try {
      await removePlayerFromTeam(playerId);
      await loadData(); // Reload to update the UI
    } catch (err) {
      console.error("Error removing player from team:", err);
      setError("Error al quitar jugador del equipo.");
    }
  };

  const CreateTeamForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: "",
      categoryId: "",
      status: "idle",
    });

    const handleSubmit = () => {
      if (formData.name && formData.categoryId) {
        onSubmit(formData);
      }
    };

    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter team name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="idle">Idle</option>
              <option value="winner">Winner</option>
              <option value="looser">Looser</option>
              <option value="risky">Risky</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Save size={16} />
              Create Team
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditTeamForm = ({ team, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: team.team.name,
      categoryId: team.team.categoryId,
    });
    const handleSubmit = () => {
      onSave(team.team.id, formData);
    };

    return (
      <div className="space-y-3">
        <label>Nombre del equipo:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indor-orange"
        />
        <label>Categoría</label>
        <select
          value={formData.categoryId}
          onChange={(e) =>
            setFormData({ ...formData, categoryId: parseInt(e.target.value) })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indor-orange accent-indor-orange"
        >
          {categories.map((category) => (
            <option className="text-black" key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <label>Estado en la pirámide</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indor-orange"
        >
          <option className="text-black" value="idle">Activo</option>
          <option className="text-black" value="winner">Ganador</option>
          <option className="text-black" value="looser">Perdedor</option>
          <option className="text-black" value="risky">En riesgo</option>
        </select>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1 px-3 py-1 bg-indor-orange/80 text-white rounded text-sm hover:bg-indor-orange"
          >
            <Save size={14} />
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
          >
            <X size={14} />
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  const PlayerModal = ({ teamId, onClose, onAddPlayer }) => {
    return (
      <div className="fixed inset-0 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-indor-black/90 text-white border-black border-2 p-6 rounded-lg max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Agregar al equipo</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availablePlayers.length === 0 ? (
              <p className="text-white">Sin jugadores disponibles</p>
            ) : (
              availablePlayers.map((player) => (
                <div
                  key={player.profile.id}
                  className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-indor-brown/60"
                >
                  <div>
                    <div className="font-medium">
                      {player.profile?.nickname ||
                        player.users?.name ||
                        "Jugador sin nombre"}
                    </div>
                    <div className="text-sm">
                      {player.users?.email}
                    </div>
                  </div>
                  <button
                    onClick={() => onAddPlayer(teamId, player.profile.id)}
                    className="px-3 py-1 bg-indor-orange/60 text-white rounded text-sm hover:bg-indor-orange"
                  >
                    Agregar
                  </button>
                </div>
              ))
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 mx-auto bg-indor-black/60 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Gestión de equipos</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indor-orange text-white rounded-md"
        >
          <Plus size={20} />
          Añadir equipo
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Cargando...</div>
        </div>
      ) : (
        <>
          {showCreateForm && (
            <CreateTeamForm
              onSubmit={handleCreateTeam}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          <div className="flex flex-wrap justify-between w-full gap-2 h-screen pb-36 overflow-scroll no-scrollbar">
            {teams.map((teamData) => (
              <div
                key={teamData.team.id}
                className="bg-indor-black/90 rounded-lg border max-w-5/6 w-max border-black p-6"
              >
                {editingTeam === teamData.team.id ? (
                  <EditTeamForm
                    team={teamData}
                    onSave={handleUpdateTeam}
                    onCancel={() => setEditingTeam(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-semibold">
                          {teamData.team.name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {teamData.category?.name || "No Category"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[teamData.team.status]
                          }`}
                        >
                          {teamData.team.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTeam(teamData.team.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Jugadores ({teamData.players?.length || 0}/2)
                        </span>
                      </div>
                      {(!teamData.players || teamData.players.length < 2) && (
                        <button
                          onClick={() => setShowPlayerModal(teamData.team.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          <UserPlus size={14} />
                          Añadir jugador
                        </button>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      {!teamData.players || teamData.players.length === 0 ? (
                        <p className="text-white text-sm">
                          Sin jugadores asignados
                        </p>
                      ) : (
                        teamData.players.map((player) => (
                          <div
                            key={player.profile?.id}
                            className="flex items-center justify-between p-3 bg-indor-black rounded-md"
                          >
                            <div>
                              <div className="font-medium">
                                {player.profile?.nickname ||
                                  player.users?.name ||
                                  "Unknown Player"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {player.users?.email}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleRemovePlayerFromTeam(player.profile?.id)
                              }
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <UserMinus size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}

            {teams.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No teams found
                </h3>
                <p className="text-gray-500 mb-4">
                  Get started by creating your first team.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Team
                </button>
              </div>
            )}
          </div>

          {showPlayerModal && (
            <PlayerModal
              teamId={showPlayerModal}
              onClose={() => setShowPlayerModal(null)}
              onAddPlayer={handleAddPlayerToTeam}
            />
          )}
        </>
      )}
    </div>
  );
};

export default TeamManagement;

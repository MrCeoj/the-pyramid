"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  Filter,
} from "lucide-react";
import { getTeams, getCategories, getPlayers } from "@/actions/TeamsActions";
import toast from "react-hot-toast";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";

interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Profile {
  id: number;
  userId: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  teamId?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  role: "player" | "admin";
  passwordHash?: string | null;
}

interface Player {
  profile: Profile;
  users?: User | null;
}

interface Team {
  id: number;
  name: string;
  categoryId?: number | null;
  wins?: number | null;
  losses?: number | null;
  status: "idle" | "winner" | "looser" | "risky" | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface TeamData {
  players: Player[];
  category: Category | null;
  team: Team;
}

const TeamManagementPage = () => {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      const data = await getTeams();
      const categories = await getCategories();
      const players = await getPlayers();
      if (!data || !categories || !players) return;

      setCategories(categories);
      setPlayers(players);
      setTeams(data);
    };
    fetchData();
  }, []);

  const filteredTeams =
    selectedCategory === "all"
      ? teams
      : teams.filter((t) => t.team.categoryId === parseInt(selectedCategory));

  const availablePlayers = players.filter((p) => !p.profile.teamId);

  const getStatusColor = (status) => {
    switch (status) {
      case "winner":
        return "bg-green-100 text-green-800";
      case "looser":
        return "bg-red-100 text-red-800";
      case "risky":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCreateTeam = async (formData) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual createTeam call
      const newTeam = {
        team: {
          id: Date.now(),
          name: formData.name,
          categoryId: parseInt(formData.categoryId),
          status: formData.status,
        },
        category: categories.find(
          (c) => c.id === parseInt(formData.categoryId)
        ),
        players: [],
      };
      setTeams([...teams, newTeam]);
      setShowCreateModal(false);
    } catch (error) {
      alert("Error creating team: " + error.message);
    }
    setLoading(false);
  };

  const handleUpdateTeam = async (formData) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual updateTeam call
      setTeams(
        teams.map((t) =>
          t.team.id === currentTeam.team.id
            ? {
                ...t,
                team: {
                  ...t.team,
                  ...formData,
                  categoryId: parseInt(formData.categoryId),
                },
                category: categories.find(
                  (c) => c.id === parseInt(formData.categoryId)
                ),
              }
            : t
        )
      );
      setShowEditModal(false);
      setCurrentTeam(null);
    } catch (error) {
      alert("Error updating team: " + error.message);
    }
    setLoading(false);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    setLoading(true);
    try {
      // Simulate API call - replace with actual deleteTeam call
      const teamToDelete = teams.find((t) => t.team.id === teamId);

      // Remove players from team first
      setPlayers(
        players.map((p) =>
          teamToDelete.players.some((tp) => tp.profile.id === p.profile.id)
            ? { ...p, profile: { ...p.profile, teamId: null } }
            : p
        )
      );

      setTeams(teams.filter((t) => t.team.id !== teamId));
    } catch (error) {
      alert("Error deleting team: " + error.message);
    }
    setLoading(false);
  };

  const handleAddPlayerToTeam = async (playerId: number) => {
    setLoading(true);
    try {
      if (!currentTeam) return
      if (currentTeam.players.length >= 2) {
        alert("Team already has 2 players");
        return;
      }

      // Simulate API call - replace with actual addPlayerToTeam call
      const player = players.find((p) => p.profile.id === playerId);

      // Update players list
      setPlayers(
        players.map((p) =>
          p.profile.id === playerId
            ? { ...p, profile: { ...p.profile, teamId: currentTeam.team.id } }
            : p
        )
      );

      // Update teams list
      setTeams(
        teams.map((t) =>
          t.team.id === currentTeam.team.id
            ? { ...t, players: [...t.players, player] }
            : t
        )
      );
      
      setCurrentTeam((prev) => ({
        ...prev,
        players: [...prev.players, player],
      }));
    } catch (error) {
      if (error instanceof Error)
        toast.error("Error adding player: " + error.message);
    }
    setLoading(false);
  };

  const handleRemovePlayerFromTeam = async (playerId) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual removePlayerFromTeam call

      // Update players list
      setPlayers(
        players.map((p) =>
          p.profile.id === playerId
            ? { ...p, profile: { ...p.profile, teamId: null } }
            : p
        )
      );

      // Update teams list
      setTeams(
        teams.map((t) =>
          t.team.id === currentTeam.team.id
            ? {
                ...t,
                players: t.players.filter((p) => p.profile.id !== playerId),
              }
            : t
        )
      );

      setCurrentTeam((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.profile.id !== playerId),
      }));
    } catch (error) {
      alert("Error removing player: " + error.message);
    }
    setLoading(false);
  };

  const newTeamName = (team: TeamData) => {
    try {

      if (!team.players) throw new Error;
  
      team.players.map((player) => {
        if (player.users === undefined || player.users === null) throw new Error;
      });
  
      if (team.players.length === 1) return team.players[0].users?.name;
  
      const name1 = team.players[0].users?.name?.split(" ")[0];
      const name2 = team.players[1].users?.name?.split(" ")[0];
  
      return name1 + " & " + name2;
    }catch(error){
      if (error instanceof Error) return null
    }
  };

  return (
    <div className="min-h-screen bg-indor-black/60 p-6">
    <UserDropdownMenu />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Equipos</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indor-orange hover:bg-orange-dense text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Equipo
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((teamData) => (
            <div
              key={teamData.team.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              {/* Team Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {teamData.team.name ||
                      newTeamName(teamData) ||
                      "Equipo sin nombre"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {teamData.category?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCurrentTeam(teamData);
                      setShowEditModal(true);
                    }}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(teamData.team.id)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    teamData.team.status
                  )}`}
                >
                  {teamData.team.status}
                </span>
              </div>

              {/* Players */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Players ({teamData.players.length}/2)
                  </span>
                  <button
                    onClick={() => {
                      setCurrentTeam(teamData);
                      setShowPlayerModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {teamData.players.map((player) => (
                    <div
                      key={player.profile.id}
                      className="text-sm text-gray-600"
                    >
                      {player.users.name}
                    </div>
                  ))}
                  {teamData.players.length === 0 && (
                    <div className="text-sm text-gray-400 italic">
                      No players assigned
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Team Modal */}
        {showCreateModal && (
          <TeamModal
            title="Create Team"
            categories={categories}
            onSubmit={handleCreateTeam}
            onClose={() => setShowCreateModal(false)}
            loading={loading}
          />
        )}

        {/* Edit Team Modal */}
        {showEditModal && currentTeam && (
          <TeamModal
            title="Edit Team"
            categories={categories}
            team={currentTeam.team}
            onSubmit={handleUpdateTeam}
            onClose={() => {
              setShowEditModal(false);
              setCurrentTeam(null);
            }}
            loading={loading}
          />
        )}

        {/* Player Management Modal */}
        {showPlayerModal && currentTeam && (
          <PlayerModal
            team={currentTeam}
            availablePlayers={availablePlayers}
            onAddPlayer={handleAddPlayerToTeam}
            onRemovePlayer={handleRemovePlayerFromTeam}
            onClose={() => {
              setShowPlayerModal(false);
              setCurrentTeam(null);
            }}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

const TeamModal = ({
  title,
  categories,
  team,
  onSubmit,
  onClose,
  loading,
}: {
  title: string;
  team: Team;
  categories: Category[];
  loading: boolean;
  onSubmit: Promise<void>;
  onClose: void;
}) => {
  const newName = () => {
    "Ola";
  };
  const [formData, setFormData] = useState({
    name: team?.name || "Equipo Sin Nombre",
    categoryId: team?.categoryId || "",
    status: team?.status || "idle",
  });

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.categoryId) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name*
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="idle">Idle</option>
              <option value="winner">Winner</option>
              <option value="looser">Looser</option>
              <option value="risky">Risky</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : title.includes("Create")
                ? "Create"
                : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerModal = ({
  team,
  availablePlayers,
  onAddPlayer,
  onRemovePlayer,
  onClose,
  loading,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Jugadores - {team.team.name}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Players */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              Current Players ({team.players.length}/2)
            </h3>
            <div className="space-y-2">
              {team.players.map((player) => (
                <div
                  key={player.profile.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{player.users.name}</div>
                    <div className="text-sm text-gray-600">
                      {player.users.email}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemovePlayer(player.profile.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {team.players.length === 0 && (
                <div className="text-gray-500 italic text-center py-4">
                  No players assigned
                </div>
              )}
            </div>
          </div>

          {/* Available Players */}
          <div>
            <h3 className="text-lg font-medium mb-3">Available Players</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availablePlayers.map((player) => (
                <div
                  key={player.profile.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{player.users.name}</div>
                    <div className="text-sm text-gray-600">
                      {player.users.email}
                    </div>
                  </div>
                  <button
                    onClick={() => onAddPlayer(player.profile.id)}
                    disabled={loading || team.players.length >= 2}
                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {availablePlayers.length === 0 && (
                <div className="text-gray-500 italic text-center py-4">
                  No available players
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPage;

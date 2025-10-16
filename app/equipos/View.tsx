"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Users, Trash2, Search, X } from "lucide-react";
import {
  getTeams,
  getCategories,
  getPlayers,
  createTeam,
  updateTeam,
  updateTeamPlayers,
  deleteTeam,
  TeamWithPlayers,
} from "@/actions/TeamsActions";
import toast from "react-hot-toast";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import Modal from "./EquipoModal";
import EditTeamForm from "./EditTeamForm";
import CreateTeamForm from "./CreateTeamForm";
import { useIsMobile } from "@/hooks/use-mobile";


type Category = { id: number; name: string };
type Player = {
  id: string;
  name: string | null;
  paternalSurname: string | null;
  nickname: string | null;
  email: string | null;
};

const TeamManagement = () => {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  // Filter teams based on search term
  const filteredTeams = useMemo(() => {
    if (!searchTerm.trim()) return teams;

    const searchLower = searchTerm.toLowerCase().trim();
    
    return teams.filter((teamData) => {
      // Check display name
      if (teamData.displayName.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Check player 1 details
      if (teamData.player1) {
        const player1Name = teamData.player1.user.name?.toLowerCase() || "";
        const player1Email = teamData.player1.user.email?.toLowerCase() || "";
        const player1Nickname = teamData.player1.profile?.nickname?.toLowerCase() || "";
        
        if (
          player1Name.includes(searchLower) ||
          player1Email.includes(searchLower) ||
          player1Nickname.includes(searchLower)
        ) {
          return true;
        }
      }

      // Check player 2 details
      if (teamData.player2) {
        const player2Name = teamData.player2.user.name?.toLowerCase() || "";
        const player2Email = teamData.player2.user.email?.toLowerCase() || "";
        const player2Nickname = teamData.player2.profile?.nickname?.toLowerCase() || "";
        
        if (
          player2Name.includes(searchLower) ||
          player2Email.includes(searchLower) ||
          player2Nickname.includes(searchLower)
        ) {
          return true;
        }
      }

      return false;
    });
  }, [teams, searchTerm]);

  useEffect(() => {
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
        setAllPlayers(playersData as Player[]);
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
    loadData();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
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
      setAllPlayers(playersData as Player[]);
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
      setEditingTeam(null);
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

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar el equipo "${teamName}"?`
      )
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

  const clearSearch = () => {
    setSearchTerm("");
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
      <UserDropdownMenu />
      {loading ? (
        <div className="py-12 text-center text-gray-400">Cargando...</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Gestión de equipos</h1>
            {isMobile ? (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="fixed bottom-7 right-5 flex items-center gap-2 p-2 text-white transition-colors duration-75 rounded-full bg-indor-orange/80 hover:bg-indor-orange"
              >
                <Plus size={26} strokeWidth={3} />
              </button>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-white transition-colors duration-75 rounded-md bg-indor-orange/80 hover:bg-indor-orange"
              >
                <Plus size={20} /> Crear equipo
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="relative">
              <Search 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                placeholder="Buscar por nombre de equipo, jugadores o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-indor-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indor-orange/80 focus:ring-1 focus:ring-indor-orange/80"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-400">
                Mostrando {filteredTeams.length} de {teams.length} equipos
              </div>
            )}
          </div>

          <Modal
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
          >
            <CreateTeamForm
              onSubmit={handleCreateTeam}
              onCancel={() => setShowCreateForm(false)}
              allPlayers={allPlayers}
              categories={categories}
              setError={setError}
              teams={teams}
            />
          </Modal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((teamData) => {
              const assignedPlayerIds = teams
                .flatMap((t) => [t.team.player1Id, t.team.player2Id])
                .filter(Boolean);

              const currentTeamPlayers = [
                teamData.team.player1Id,
                teamData.team.player2Id,
              ].filter(Boolean);

              const availablePlayersForEdit = allPlayers.filter(
                (p) =>
                  !assignedPlayerIds.includes(p.id) ||
                  currentTeamPlayers.includes(p.id)
              );

              return (
                <div
                  key={teamData.team.id}
                  className="flex flex-col justify-between p-5 border border-gray-700 rounded-lg bg-indor-black"
                >
                  {editingTeam === teamData.team.id ? (
                    <EditTeamForm
                      teamData={teamData}
                      onSave={(data) =>
                        handleUpdateTeam(teamData.team.id, teamData, data)
                      }
                      onCancel={() => setEditingTeam(null)}
                      availablePlayers={availablePlayersForEdit}
                      categories={categories}
                      setError={setError}
                    />
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {teamData.displayName}
                          </h3>
                          <span className="text-sm text-gray-400">
                            {teamData.category?.name || "No Category"}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            statusColors[teamData.team.status!]
                          }`}
                        >
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
                    <button
                      onClick={() => setEditingTeam(teamData.team.id)}
                      className="p-2 text-gray-400 rounded-md hover:text-white hover:bg-gray-700"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteTeam(teamData.team.id, teamData.displayName)
                      }
                      className="p-2 text-gray-400 rounded-md hover:text-red-500 hover:bg-gray-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {!loading && filteredTeams.length === 0 && searchTerm && (
              <div className="col-span-full py-12 text-center rounded-lg bg-indor-black">
                <h3 className="mb-2 text-lg font-medium text-white">
                  No se encontraron equipos
                </h3>
                <p className="mb-4 text-gray-400">
                  No hay equipos que coincidan con &quot;{searchTerm}&quot;
                </p>
              </div>
            )}

            {!loading && teams.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-lg bg-indor-black">
                <Users size={48} className="mx-auto mb-4 text-gray-500" />
                <h3 className="mb-2 text-lg font-medium text-white">
                  No se encontraron equipos.
                </h3>
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
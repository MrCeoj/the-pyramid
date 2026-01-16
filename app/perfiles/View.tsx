"use client";
import { useState, useEffect } from "react";
import {
  getUsersPaginated,
  createUserWithProfile,
  updateUserWithProfile
} from "@/actions/ProfileManagementActions";
import { Plus, Pencil, ChevronLeft, ChevronRight, Search } from "lucide-react";
import UserFormModal from "./UserFormModal";
import { toast } from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";

export default function UsersPage() {
  const [filteredUsers, setFilteredUsers] = useState<UserWithProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithProfile | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState(""); // New state for the actual applied search
  const isMobile = useIsMobile();

  const PAGE_SIZE = isMobile ? 8 : 20;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const loadUsers = async (searchTerm = appliedSearch) => {
    try {
      const { userArray, total } = await getUsersPaginated(
        page,
        PAGE_SIZE,
        searchTerm
      );
      setFilteredUsers(userArray);
      setTotal(total);
    } catch {
      toast.error("No se pudieron cargar los usuarios.");
    }
  };

  // Handle search execution
  const handleSearch = () => {
    setAppliedSearch(search);
    setPage(1); // Reset to first page when searching
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearch("");
    setAppliedSearch("");
    setPage(1);
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { userArray, total } = await getUsersPaginated(
          page,
          PAGE_SIZE,
          appliedSearch // Use appliedSearch instead of search
        );
        setFilteredUsers(userArray);
        setTotal(total);
      } catch {
        toast.error("No se pudieron cargar los usuarios.");
      }
    };
    loadUsers();
  }, [page, appliedSearch, PAGE_SIZE]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (formData: any) => {
    try {
      if (editingUser) {
        await updateUserWithProfile(editingUser.id, formData);
        toast.success("Usuario actualizado.");
      } else {
        await createUserWithProfile(formData);
        toast.success("Usuario creado.");
      }
      setIsModalOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-indor-black/60 text-white relative">
      {/* Desktop Dropdown */}
      <UserDropdownMenu />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 pt-10 border-b border-indor-brown-light/30 gap-3">
        <h1 className="text-2xl font-bold">Usuarios</h1>

        {/* Search bar */}
        <div className="flex items-center gap-2 w-full md:w-1/3">
          <input
            type="text"
            placeholder="Buscar por nombre, email o apodo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="w-full pl-3 pr-3 py-2 rounded bg-indor-brown/20 border border-indor-brown-light/30 focus:outline-none focus:border-indor-orange transition-colors"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-2 bg-indor-orange hover:bg-orange-pale rounded transition-colors h-full"
            title="Buscar"
          >
            <Search size={16} strokeWidth={3}/>
          </button>
          {appliedSearch && (
            <button
              onClick={handleClearSearch}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors shrink-0"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* New user button */}
        {!isMobile && (
          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="flex font-bold items-center gap-2 px-4 py-2 bg-indor-orange hover:bg-orange-pale rounded transition-colors"
          >
            <Plus size={24} /> Nuevo usuario
          </button>
        )}
      </div>

      {/* Search info */}
      {appliedSearch && (
        <div className="px-4 py-2 text-sm text-gray-300 bg-indor-brown/20">
          Mostrando resultados para: &quot;{appliedSearch}&quot; ({total}{" "}
          encontrados)
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        <table className="w-full border border-indor-brown-light/30 rounded-lg overflow-hidden">
          <thead className="bg-indor-brown/30">
            {isMobile ? (
              <tr>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            ) : (
              <tr>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Rol</th>
                <th className="px-4 py-2 text-left">Apodo</th>
                <th className="px-4 py-2 text-right">Acciones</th>
              </tr>
            )}
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  {appliedSearch
                    ? "No se encontraron usuarios con esos criterios."
                    : "No se encontraron usuarios."}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-t bg-indor-black/80 border-indor-brown-light/20"
                >
                  {isMobile ? (
                    <>
                      <td className="px-3 py-2 text-ellipsis">{u.displayName}</td>
                      <td className="px-3 py-2 max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {u.email}
                      </td>
                      <td className="px-3 py-2 text-right flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-indor-brown/30 rounded"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{u.displayName}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2 capitalize">
                        {u.role === "admin" ? "Organizador" : "Jugador"}
                      </td>
                      <td className="px-4 py-2">
                        {u.profile?.nickname || "-"}
                      </td>
                      <td className="px-4 py-2 text-right flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-indor-brown/30 rounded"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 items-center p-4 border-t border-indor-brown-light/30">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 bg-orange-vivid/80 rounded disabled:opacity-20"
        >
          <ChevronLeft />
        </button>
        <span className="text-sm text-gray-300">
          Página {page} de {totalPages || 1}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 bg-orange-vivid/80 rounded disabled:opacity-20"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Floating buttons for mobile */}
      {isMobile && (
        <>
          <div className="fixed top-3 right-3 z-50">
            <UserDropdownMenu />
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="fixed bottom-4 right-4 p-3 bg-indor-orange hover:bg-orange-pale rounded-full transition-colors shadow-lg z-40"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <UserFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          onSave={handleSave}
          initialData={editingUser || undefined}
        />
      )}
    </div>
  );
}

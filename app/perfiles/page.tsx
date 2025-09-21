"use client";
import { useState, useEffect } from "react";
import {
  getUsers,
  createUserWithProfile,
  updateUserWithProfile,
} from "./userinteractions";
import { Plus, Pencil } from "lucide-react";
import UserFormModal from "./UserFormModal";
import { toast } from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: "admin" | "player";
  profile?: Profile;
}

interface Profile {
  nickname?: string | null;
  avatarUrl?: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const isMobile = useIsMobile();
  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error("No se pudieron cargar los usuarios.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
    <div className="flex flex-col h-screen bg-indor-black/60 text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-indor-brown-light/30">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        {isMobile ? (
          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="p-2 bg-indor-orange hover:bg-orange-pale rounded-full transition-colors"
          >
            <Plus size={24} strokeWidth={3}/>
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indor-orange hover:bg-orange-pale rounded transition-colors"
          >
            <Plus size={16} /> Nuevo usuario
          </button>
        )}
      </div>

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
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t bg-indor-black/80 border-indor-brown-light/20"
                >
                  {isMobile ? (
                    <>
                      <td className="px-3 py-2 text-ellipsis">{u.name}</td>
                      <td className="px-3 py-2 max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis">{u.email}</td>
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
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2 capitalize">{u.role}</td>
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

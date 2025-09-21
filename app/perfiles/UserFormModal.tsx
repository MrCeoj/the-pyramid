"use client";

import { X, Save, User } from "lucide-react";
import { useState, useEffect } from "react";

interface Profile {
  nickname?: string | null;
  avatarUrl?: string | null;
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: "admin" | "player";
  profile?: Profile;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserData) => Promise<void>;
  initialData?: UserData;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: UserFormModalProps) {
  const [formData, setFormData] = useState<UserData>({
    id: "",
    name: "",
    email: "",
    role: "player",
    profile: { nickname: "", avatarUrl: "" },
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (field: string, value: string) => {
    if (field in formData) {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      setFormData((prev) => ({
        ...prev,
        profile: { ...prev.profile, [field]: value },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch {
      /* errors handled outside */
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-indor-black border border-black rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black">
          <div className="flex items-center gap-2">
            <User size={20} className="text-white" />
            <h2 className="text-white font-medium">
              {initialData ? "Editar usuario" : "Nuevo usuario"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Nombre</label>
            <input
              type="text"
              value={formData.name!}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-3 py-2 bg-indor-black border border-indor-brown-light rounded text-white placeholder-gray-400 focus:border-indor-brown-light focus:outline-none"
              placeholder="Nombre completo"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Email</label>
            <input
              type="email"
              value={formData.email!}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3 py-2 bg-indor-black border border-indor-brown-light rounded text-white placeholder-gray-400 focus:border-indor-brown-light focus:outline-none"
              placeholder="correo@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="w-full px-3 py-2 bg-indor-black border border-indor-brown-light rounded text-white focus:border-indor-brown-light focus:outline-none"
            >
              <option value="player">Jugador</option>
              <option value="admin">Organizador</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-300 hover:text-white border border-indor-brown-light/50 rounded hover:border-indor-brown-light transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indor-orange text-white rounded hover:bg-orange-pale transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save size={16} />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

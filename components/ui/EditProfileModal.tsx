"use client";
import { X, User, Save, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { toast } from "react-hot-toast";

interface Profile {
  nickname?: string;
  avatarUrl?: string;
}

interface User {
  name?: string;
  email?: string;
  image?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => Promise<void>;
  initialData?: {
    user: User;
    profile?: Profile;
  };
}

interface FormData {
  name: string;
  email: string;
  image: string;
  nickname: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EditProfileModalProps) {
  const { session } = useSessionStore();
  const isAdmin = session?.user?.role === "admin";
  const [isLoading, setIsLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (passwordError !== "") toast.error(passwordError);
  }, [passwordError]);

  const [formData, setFormData] = useState<FormData>({
    // Common data (users)
    name: "",
    email: "",
    image: "",
    // Player's profile data
    nickname: "",
    // Passwords (optional)
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        name: initialData.user.name || "",
        email: initialData.user.email || "",
        image: initialData.user.image || "",
        nickname: initialData.profile?.nickname || "",
      }));
    }
  }, [initialData]);

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      image: "",
      nickname: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setChangePassword(false);
    setPasswordError("");

    onClose();
  };

  useEffect(() => {
    if (!initialData) {
      setDisabled(false);
      return;
    }

    const initialBaseData = {
      name: initialData.user.name || "",
      email: initialData.user.email || "",
      image: initialData.user.image || "",
      nickname: initialData.profile?.nickname || "",
    };

    const currentBaseData = {
      name: formData.name,
      email: formData.email,
      image: formData.image,
      nickname: formData.nickname,
    };

    const isChanged =
      JSON.stringify(initialBaseData) !== JSON.stringify(currentBaseData);

    const isPasswordFormChanged =
      changePassword &&
      (formData.currentPassword ||
        formData.newPassword ||
        formData.confirmPassword);

    setDisabled(!isChanged && !isPasswordFormChanged);
  }, [formData, initialData, changePassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (changePassword && formData.newPassword !== formData.confirmPassword) {
      setPasswordError("Las nuevas contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = { ...formData };
      if (!changePassword) {
        delete payload.currentPassword;
        delete payload.newPassword;
        delete payload.confirmPassword;
      }
      await onSave(payload);
      handleClose();
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-indor-black border border-black rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black">
          <div className="flex items-center gap-2">
            <User size={20} className="text-white" />
            <h2 className="text-white font-medium">Editar perfil</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Primer apellido
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 bg-indor-black border border-indor-brown-light rounded text-white placeholder-gray-400 focus:border-indor-brown-light focus:outline-none"
                placeholder="Primer apellido"
              />
            </div>

            {/* Player Profile Info (only for players) */}
            {!isAdmin && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Apodo (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) =>
                      handleInputChange("nickname", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-indor-black border border-indor-brown-light rounded text-white placeholder-gray-400 focus:border-indor-brown-light focus:outline-none"
                    placeholder="¿Cómo te gustaria que te llamen?"
                  />
                </div>
              </div>
            )}

            <label className="block text-gray-300 text-sm mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full px-3 py-2 bg-indor-black border border-indor-brown-light rounded text-white placeholder-gray-400 focus:border-indor-brown-light focus:outline-none"
              placeholder="tu@email.com"
            />

            {/* Password Change Option */}
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="changePassword"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                className="w-4 h-4 text-indor-orange border-gray-400 rounded focus:ring-indor-orange"
              />
              <label
                htmlFor="changePassword"
                className="text-sm text-gray-300 flex items-center gap-1"
              >
                <Lock size={16} /> ¿Quieres cambiar tu contraseña?
              </label>
            </div>

            {changePassword && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      handleInputChange("currentPassword", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-indor-black border border-indor-brown-light rounded text-white focus:border-indor-brown-light focus:outline-none"
                    placeholder="Tu contraseña actual"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      handleInputChange("newPassword", e.target.value)
                    }
                    className={`${
                      passwordError !== ""
                        ? "border-red-500 focus:border-red-500"
                        : "border-indor-brown-light focus:border-indor-brown-light"
                    } w-full px-3 py-2 bg-indor-black border border-indor-brown-light rounded text-white focus:border-indor-brown-light focus:outline-none`}
                    placeholder="Nueva contraseña"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={`${
                      passwordError !== ""
                        ? "border-red-500 focus:border-red-500"
                        : "border-indor-brown-light focus:border-indor-brown-light"
                    } w-full px-3 py-2 bg-indor-black border  rounded text-white  focus:outline-none`}
                    placeholder="Repite tu nueva contraseña"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-300 hover:text-white border border-indor-brown-light/50 rounded hover:border-indor-brown-light transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || disabled}
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

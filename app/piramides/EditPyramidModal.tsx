"use client";
import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updatePyramid } from "@/actions/PyramidActions";
import { getCategories } from "@/actions/TeamsActions";
import toast from "react-hot-toast";

interface EditPyramidModalProps {
  pyramid: Pyramid;
  isOpen: boolean;
  onClose: () => void;
}

export function EditPyramidModal({
  pyramid,
  isOpen,
  onClose,
}: EditPyramidModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    row_amount: number;
    active: boolean;
    categories: number[];
  }>({
    name: "",
    description: "",
    row_amount: 1,
    active: true,
    categories: [],
  });

  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategories();
      if (!res) return;
      setCats(res);
    } catch (error) {
      if (error instanceof Error) toast.error("Error al cargar categorías");
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (isOpen && pyramid) {
      setFormData({
        name: pyramid.name,
        description: pyramid.description || "",
        row_amount: pyramid.row_amount || 1,
        categories: pyramid.categories || [],
        active: pyramid.active,
      });
    }
  }, [isOpen, pyramid]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await updatePyramid(pyramid.id, formData);
      if (!res.success) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    } catch (err) {
      setError("Error al actualizar la pirámide");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 text-white">
      <div className="bg-indor-black/90 border-black border-2 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Editar pirámdide</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Nombre*</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-indor-orange focus:border-indor-orange"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-indor-orange focus:border-indor-orange"
              rows={3}
            />
          </div>

          {/* Rows */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Cantidad de filas
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.row_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  row_amount:
                    e.target.value === "" ? 0 : parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-indor-orange focus:border-indor-orange"
            />
          </div>

          {/* Categories — SAME as CreatePyramidModal */}
          <div>
            <label className="block text-sm font-medium mb-1">Categorías</label>

            <div className="space-y-2 max-h-15 rounded-lg p-2 grid grid-cols-3 gap-2">
              {cats.length === 0 && (
                <p className="text-gray-400 text-sm">
                  No hay categorías disponibles.
                </p>
              )}

              {cats.map((cat) => {
                const checked = formData.categories.includes(cat.id);

                return (
                  <label
                    key={cat.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setFormData((prev) => {
                          const already = prev.categories.includes(cat.id);
                          return {
                            ...prev,
                            categories: already
                              ? prev.categories.filter((c) => c !== cat.id)
                              : [...prev.categories, cat.id],
                          };
                        });
                      }}
                      className="h-4 w-4 accent-indor-orange"
                    />
                    <span className="text-xs sm:text-sm">{cat.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="edit-active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="h-4 w-4 text-indor-orange focus:ring-orange-pale border-white rounded accent-indor-orange"
            />
            <label htmlFor="edit-active" className="ml-2 block text-sm">
              ¿Está activa?
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indor-orange hover:bg-orange-pale text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

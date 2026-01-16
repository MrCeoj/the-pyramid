"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPyramid } from "@/actions/PyramidActions";
import { getCategories } from "@/actions/TeamsActions";

interface CreatePyramidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePyramidModal({
  isOpen,
  onClose,
}: CreatePyramidModalProps) {
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  const router = useRouter();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategories();
      if (!res) return;
      setCats(res);
    } catch (error) {
      if (error instanceof Error)
        setError("Error al conseguir categorías")
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await createPyramid(formData);
      onClose();
      setFormData({
        name: "",
        description: "",
        row_amount: 1,
        active: true,
        categories: [],
      });
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError("Failed to create pyramid: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 text-white">
      <div className="bg-indor-black/80 rounded-lg p-6 w-full max-w-md mx-4 border-2 border-black">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Crear nueva pirámide</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre:*</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indor-orange focus:border-indor-orange"
              placeholder="Nombre de la pirámide"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Descripción:
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indor-orange focus:border-indor-orange"
              rows={3}
              placeholder="Descripción corta de la pirámide"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Cantidad de filas:
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.row_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  row_amount: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indor-orange focus:border-indor-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Categorías:
            </label>

            <div className="space-y-2 max-h-16 rounded-lg p-2 grid grid-cols-3 justify-between">
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="h-4 w-4 text-white accent-indor-orange focus:ring-indor-orange border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm">
              ¿Está activa?
            </label>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

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
              {isLoading ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

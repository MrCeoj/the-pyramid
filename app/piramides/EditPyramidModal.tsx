"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updatePyramid } from "@/actions/PyramidActions";

interface Pyramid {
  id: number;
  name: string;
  description: string | null;
  row_amount: number | null;
  active: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    row_amount: 1,
    active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isOpen && pyramid) {
      setFormData({
        name: pyramid.name,
        description: pyramid.description || "",
        row_amount: pyramid.row_amount || 1,
        active: pyramid.active,
      });
    }
  }, [isOpen, pyramid]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await updatePyramid(pyramid.id, formData);
      onClose();
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError("Failed to update pyramid");
      }
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
                  row_amount: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-indor-orange focus:border-indor-orange"
            />
          </div>

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
            <label
              htmlFor="edit-active"
              className="ml-2 block text-sm text-white"
            >
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
              {isLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

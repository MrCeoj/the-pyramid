'use client';

import { useState } from 'react';
import { Trash2, Edit, Eye } from 'lucide-react';
import { EditPyramidModal } from './EditPyramidModal';
import { DeletePyramidDialog } from './DeletePyramidDialog';
import { useRouter } from 'next/navigation';

interface Pyramid {
  id: number;
  name: string;
  description: string | null;
  row_amount: number | null;
  active: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface PyramidCardProps {
  pyramid: Pyramid;
}

export function PyramidCard({ pyramid }: PyramidCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const handleView = () => {
    router.push(`/pyramids/${pyramid.id}`);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {pyramid.name}
            </h3>
            {pyramid.description ? (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {pyramid.description}
              </p>
            ) : (<p className="text-gray-600 text-sm mb-3 line-clamp-2">
                Sin descripción
              </p>)}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            pyramid.active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {pyramid.active ? 'Activa' : 'Inactiva'}
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          <div>Cantidad de Filas: {pyramid.row_amount || 1}</div>
          <div>Creado: {pyramid.createdAt?.toLocaleDateString()}</div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleView}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <EditPyramidModal
        pyramid={pyramid}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      <DeletePyramidDialog
        pyramid={pyramid}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </>
  );
}

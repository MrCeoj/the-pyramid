// app/pyramids/components/DeletePyramidDialog.tsx (Client Component)
'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deletePyramid } from './actions';

interface Pyramid {
  id: number;
  name: string;
  description: string | null;
  row_amount: number | null;
  active: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface DeletePyramidDialogProps {
  pyramid: Pyramid;
  isOpen: boolean;
  onClose: () => void;
}

export function DeletePyramidDialog({ pyramid, isOpen, onClose }: DeletePyramidDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setError('');

    try {
      await deletePyramid(pyramid.id);
      onClose();
      router.refresh();
    } catch (err) {
      setError('Failed to delete pyramid');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold">Delete Pyramid</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete the pyramid: {pyramid.name}?
          </p>
          <p className="text-sm text-red-600">
            This action cannot be undone and will remove all associated positions and history.
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-4">{error}</div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// app/pyramids/components/CreatePyramidButton.tsx (Client Component)
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreatePyramidModal } from './CreatePyramidModal';

export function CreatePyramidButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Plus size={20} />
        Añadir nueva pirámide
      </button>

      <CreatePyramidModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
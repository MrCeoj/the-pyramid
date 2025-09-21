// app/pyramids/components/CreatePyramidButton.tsx (Client Component)
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreatePyramidModal } from "./CreatePyramidModal";
import { useIsMobile } from "@/hooks/use-mobile";

export function CreatePyramidButton() {
  const [showModal, setShowModal] = useState(false);
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile ? (
        <button
          onClick={() => setShowModal(true)}
          className="bg-indor-orange hover:bg-orange-pale rounded-full border-indor-black ring-indor-black text-white font-bold p-3 transition-colors fixed bottom-5 right-5"
        >
          <Plus size={30} strokeWidth={3} />
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="bg-indor-orange hover:bg-orange-pale text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Añadir nueva pirámide
        </button>
      )}

      <CreatePyramidModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

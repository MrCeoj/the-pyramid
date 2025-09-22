import { Plus } from "lucide-react";

const EmptySlot = ({
  rowNumber,
  posNumber,
}: {
  rowNumber: number;
  posNumber: number;
}) => {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/30 p-4 min-w-[150px] max-w-[170px] backdrop-blur-sm hover:bg-slate-900/40 transition-colors duration-75 cursor-pointer">
      <div className="text-center">
        <div className="font-semibold text-sm text-slate-400">Lugar Vacío</div>
        <div className="flex flex-row items-center justify-center py-1 mt-1 text-xs h-[20px] text-slate-400/50">
          <Plus size={16} strokeWidth={3} />
          <p>Añadir equipo</p>
        </div>
        <div className="text-xs text-slate-500 pt-2">
          Fila {rowNumber} • Posición {posNumber}
        </div>
      </div>
    </div>
  );
};

export default EmptySlot;

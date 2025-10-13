const EmptySlot: React.FC<{ rowNumber: number; posNumber: number }> = ({
  rowNumber,
  posNumber,
}) => {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/30 p-4 min-w-[150px] max-w-[170px] backdrop-blur-sm">
      <div className="text-center">
        <div className="font-semibold text-sm text-slate-400 mb-3">
          Lugar Vacío
        </div>
        <div className="text-xs text-slate-500">
          {rowNumber < 8 ? `Fila ${rowNumber} • Posición ${posNumber}` : "Nadie quiere estar aqui..."}
        </div>
      </div>
    </div>
  );
};

export default EmptySlot;
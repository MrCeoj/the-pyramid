// components/scoring-slides/SummarySlide.tsx
import { ChevronLeft } from "lucide-react";

export function SummarySlide({ onPrev }: ScoringSlideProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-bold text-white">Próximo paso</h2>

      <div
        className="px-8 py-6 rounded-xl bg-slate-700/30
                      border border-blue-500/30 text-center"
      >
        <p className="text-sm text-slate-400">Sets seleccionados</p>
      </div>

      <button
        onClick={onPrev}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                   bg-slate-700/30 border border-slate-600/50
                   hover:border-blue-400/40 transition"
      >
        <ChevronLeft size={18} />
        Volver
      </button>
    </div>
  );
}

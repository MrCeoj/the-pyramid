// components/scoring-slides/SetsCountSlide.tsx
import { useUsersMatchScoresStore } from "@/stores/useUsersMatchScoresStore";
import { Plus, Minus, ChevronRight } from "lucide-react";

export function SetsCountSlide({ onNext }: ScoringSlideProps) {
  const { setCount, setSetCount } = useUsersMatchScoresStore();
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Cantidad de sets</h2>
        <p className="mt-2 text-sm text-slate-400">
          Ingresa cuántos sets se jugaron
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={() => setCount > 2 && setSetCount(setCount - 1)}
          disabled={setCount <= 2}
          className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/50
                     text-slate-400 hover:text-white disabled:opacity-40 transition"
        >
          <Minus size={18} />
        </button>

        <div
          className="min-w-[96px] py-5 rounded-2xl text-center
                        bg-slate-700/30 border border-blue-500/30"
        >
          <span className="text-4xl font-bold text-blue-400">{setCount}</span>
        </div>

        <button
          onClick={() => setCount < 5 && setSetCount(setCount + 1)}
          disabled={setCount >= 5}
          className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/50
                     text-slate-400 hover:text-white disabled:opacity-40 transition"
        >
          <Plus size={18} />
        </button>
      </div>

      <button
        onClick={onNext}
        className="flex items-center gap-2 px-6 py-3 rounded-xl
                   bg-blue-600/20 text-blue-400 border border-blue-500/30
                   hover:bg-blue-600/30 transition"
      >
        Continuar
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

// components/scoring-slides/SetsCountSlide.tsx
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useUsersMatchScoresStore } from "@/stores/useUsersMatchScoresStore";

export function SetCountConfirmationSlide({
  onPrev,
  onNext,
}: ScoringSlideProps) {
  const { loading, beginScoring, setCount } = useUsersMatchScoresStore();

  const handleStartScoring = () => {
    try {
      beginScoring();
      onNext();
    } catch (error) {}
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">
          Una cuenta regresiva empezará
        </h2>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-slate-400">Cantidad de Sets jugados</p>
        <div
          className="min-w-[96px] py-5 rounded-2xl text-center
          bg-slate-700/30 border border-blue-500/30"
        >
          <span className="text-4xl font-bold text-blue-400">{setCount}</span>
        </div>
      </div>
      <h3 className="mt-2 text-base text-center text-slate-400">
        Tendrán 1 hora para anotar el puntaje de la reta
      </h3>
      <div className="flex gap-2 mt-2">
        <button
          onClick={onPrev}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                   bg-blue-600/20 text-blue-500 border border-blue-500/30
                   hover:bg-blue-600/30 transition
                   disabled:bg-slate-600/20 disabled:text-slate-400 disabled:border-slate-500/30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
          Regresar
        </button>

        <button
          onClick={handleStartScoring}
          disabled={setCount < 2 || setCount > 5 || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                   bg-blue-600/20 text-blue-400 border border-blue-500/30
                   hover:bg-blue-600/30 transition
                   disabled:bg-slate-600/20 disabled:text-slate-400 disabled:border-slate-500/30 disabled:cursor-not-allowed"
        >
          Continuar
          {loading ? (
            <div className="w-4 h-4 border-3 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
      </div>
    </div>
  );
}

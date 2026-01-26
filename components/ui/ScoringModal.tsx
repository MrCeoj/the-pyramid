"use client";

import { useUsersMatchesStore } from "@/stores/useUsersMatchStore";
import { X, ChevronRight, ChevronLeft, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function ScoringModal({
  scoringMatch,
  open,
}: {
  scoringMatch: number;
  open: boolean;
}) {
  const { toggleModal } = useUsersMatchesStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [numberOfSets, setNumberOfSets] = useState(3);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    setDirection(1);
    setCurrentSlide((v) => v + 1);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentSlide((v) => v - 1);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-indor-black/60 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => toggleModal()}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="
              relative w-[460px] overflow-hidden
              bg-slate-800/70 backdrop-blur-md
              border border-slate-700/50
              rounded-2xl p-8
              shadow-lg hover:shadow-xl
            "
          >
            {/* subtle blue glow */}
            <div
              className="
                pointer-events-none
                absolute -top-24 -left-24
                w-64 h-64 rounded-full
                blur-3xl
                bg-gradient-to-br from-blue-500/20 to-transparent
              "
            />

            {/* Close */}
            <button
              onClick={() => toggleModal()}
              className="
                absolute top-4 right-4
                p-2 rounded-lg
                text-slate-400 hover:text-white
                hover:bg-white/10 transition
              "
            >
              <X size={18} />
            </button>

            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center justify-center min-h-[260px]"
              >
                {currentSlide === 0 && (
                  <div className="flex flex-col items-center gap-8 w-full">
                    {/* Header */}
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-white">
                        Cantidad de sets
                      </h2>
                      <p className="mt-2 text-sm text-slate-400">
                        Ingresa cuántos sets se jugaron
                      </p>
                    </div>

                    {/* Counter */}
                    <div className="flex items-center gap-5">
                      <button
                        onClick={() =>
                          numberOfSets > 2 && setNumberOfSets((v) => v - 1)
                        }
                        disabled={numberOfSets <= 2}
                        className="
                          p-3 rounded-xl
                          bg-slate-700/30
                          border border-slate-600/50
                        text-slate-400 hover:text-white
                          hover:border-blue-400/40
                          disabled:opacity-40 disabled:cursor-not-allowed
                          transition
                        "
                      >
                        <Minus size={18} />
                      </button>

                      <div
                        className="
                          min-w-[96px] py-5 rounded-2xl text-center
                          bg-slate-700/30
                          border border-blue-500/30
                        "
                      >
                        <span className="text-4xl font-bold text-blue-400">
                          {numberOfSets}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          numberOfSets < 5 && setNumberOfSets((v) => v + 1)
                        }
                        disabled={numberOfSets >= 5}
                        className="
                          p-3 rounded-xl
                          bg-slate-700/30
                          border border-slate-600/50
                          hover:border-blue-400/40
                        text-slate-400 hover:text-white
                          disabled:opacity-40 disabled:cursor-not-allowed
                          transition
                        "
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={handleNext}
                      className="
                        mt-2
                        flex items-center gap-2
                        px-6 py-3 rounded-xl
                        bg-blue-600/20 text-blue-400
                        border border-blue-500/30
                        hover:bg-blue-600/30 hover:border-blue-500/50
                        transition
                      "
                    >
                      Continuar
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                {currentSlide === 1 && (
                  <div className="flex flex-col items-center gap-6">
                    <h2 className="text-xl font-bold text-white">
                      Próximo paso
                    </h2>

                    <div
                      className="
                        px-8 py-6 rounded-xl
                        bg-slate-700/30
                        border border-blue-500/30
                        text-center
                      "
                    >
                      <p className="text-sm text-slate-400">
                        Sets seleccionados
                      </p>
                      <div className="mt-2 text-3xl font-bold text-blue-400">
                        {numberOfSets}
                      </div>
                    </div>

                    <button
                      onClick={handlePrev}
                      className="
                        flex items-center gap-2
                        px-5 py-2.5 rounded-xl
                        bg-slate-700/30
                        border border-slate-600/50
                        hover:border-blue-400/40
                        transition
                      "
                    >
                      <ChevronLeft size={18} />
                      Volver
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

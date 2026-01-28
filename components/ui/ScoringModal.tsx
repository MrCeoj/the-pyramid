"use client";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useUsersMatchScoresStore } from "@/stores/useUsersMatchScoresStore";
import { scoringSlides } from "@/components/ui/ScoringModalSlides";

export default function ScoringModal() {
  const { closeScoring, scoringModal } = useUsersMatchScoresStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [numberOfSets, setNumberOfSets] = useState(3);
  const [direction, setDirection] = useState(0);
  const ActiveSlide = scoringSlides[currentSlide];

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
      {scoringModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-indor-black/60 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeScoring}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="
              relative max-w-[95dvw] w-[460px] overflow-hidden
              bg-slate-800/70 backdrop-blur-md
              border border-slate-700/50
              rounded-2xl p-8
              shadow-lg hover:shadow-xl
              transition-all duration-75
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
              onClick={closeScoring}
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
                <ActiveSlide onNext={handleNext} onPrev={handlePrev} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

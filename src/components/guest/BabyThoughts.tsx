"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BABY_THOUGHTS } from "@/lib/constants";

export function BabyThoughts({ compact = false }: { compact?: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BABY_THOUGHTS.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const nextThought = () => {
    setIndex((prev) => (prev + 1) % BABY_THOUGHTS.length);
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
          className={`relative flex w-full flex-col items-center rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/90 via-pink-50/70 to-sky-50/90 shadow-lg backdrop-blur ${
            compact ? "p-4 text-center" : "p-6 text-center sm:p-7"
          }`}
        >
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="animate-float-slow text-2xl">👶💬</span>
            <span className="rounded-full bg-amber-200/80 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
              Pensamiento del Bebé
            </span>
          </div>

          <p className="font-sans text-sm font-extrabold leading-relaxed text-slate-800 sm:text-base">
            &ldquo;{BABY_THOUGHTS[index]}&rdquo;
          </p>

          {/* Speech bubble tail indicator */}
          <div className="mt-3 flex items-center justify-between w-full pt-2 border-t border-amber-200/50 text-[11px] font-bold text-amber-900/80">
            <span>💭 ¡Cambiando pensamiento cada 6s!</span>
            <button
              onClick={nextThought}
              className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-amber-900 shadow-sm transition hover:bg-white hover:scale-105 active:scale-95"
            >
              🎲 Otro pensamiento →
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

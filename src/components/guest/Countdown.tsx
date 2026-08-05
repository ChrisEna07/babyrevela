"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Countdown({
  endsAt,
  onComplete,
}: {
  endsAt: number | null;
  onComplete?: () => void;
}) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0 && onComplete) {
        const timeout = window.setTimeout(onComplete, 800);
        return () => window.clearTimeout(timeout);
      }
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [endsAt, onComplete]);

  if (seconds === null) return null;

  const finished = seconds <= 0;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-center text-lg font-bold uppercase tracking-widest text-ink-soft">
        La revelación está por venir…
      </p>

      <div className="relative flex h-52 w-52 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-baby-blue via-white to-baby-pink shadow-2xl shadow-baby-blue/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-3 rounded-full bg-white/90"
          animate={{ rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative flex flex-col items-center">
          <AnimatePresence mode="popLayout">
            {!finished && (
              <motion.span
                key={seconds}
                initial={{ scale: 2.2, opacity: 0, y: -28 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.4, opacity: 0, y: 24 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
                className="font-display text-8xl text-ink"
              >
                {seconds}
              </motion.span>
            )}
          </AnimatePresence>
          {finished && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="flex flex-col items-center"
            >
              <span className="animate-pulse-gold text-6xl">✨</span>
              <span className="mt-2 font-display text-3xl text-gold-dark">
                ¡Ya viene!
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <p className="animate-pulse-gold text-sm font-bold uppercase tracking-widest text-gold-dark">
        {finished ? "Preparados… ¡mira la pantalla!" : "¡Todo el mundo en pantalla!"}
      </p>
    </div>
  );
}

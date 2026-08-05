"use client";

import { motion } from "framer-motion";

export function FullPageLoader({ label = "Conectando…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <motion.div
        className="h-14 w-14 rounded-full border-4 border-baby-pink-light border-t-baby-pink"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-sm font-bold uppercase tracking-widest text-ink-soft">
        {label}
      </p>
    </div>
  );
}

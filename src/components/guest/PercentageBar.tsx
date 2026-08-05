"use client";

import { motion } from "framer-motion";
import type { VoteTotals } from "@/lib/types";

export function PercentageBar({ totals }: { totals: VoteTotals }) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between">
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            Team Niño 💙
          </p>
          <p className="font-display text-2xl text-baby-blue-dark">
            {totals.boyPercent}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            Team Niña 💗
          </p>
          <p className="font-display text-2xl text-baby-pink-dark">
            {totals.girlPercent}%
          </p>
        </div>
      </div>

      <div className="flex h-6 w-full overflow-hidden rounded-full border-2 border-white bg-baby-pink-light shadow-inner">
        <motion.div
          className="flex items-center justify-end bg-gradient-to-r from-baby-blue to-baby-blue-dark pr-1 text-[10px] font-bold text-white"
          animate={{ width: `${totals.boyPercent}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        >
          {totals.boyPercent > 8 ? totals.boyPercent : ""}
        </motion.div>
        <motion.div
          className="flex items-center justify-start bg-gradient-to-l from-baby-pink to-baby-pink-dark pl-1 text-[10px] font-bold text-white"
          animate={{ width: `${totals.girlPercent}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        >
          {totals.girlPercent > 8 ? totals.girlPercent : ""}
        </motion.div>
      </div>

      <p className="mt-2 text-center text-xs font-semibold text-ink-soft">
        {totals.total === 0
          ? "Aún no hay votos… ¡sé el primero!"
          : `${totals.total} invitado${totals.total === 1 ? "" : "s"} votaron`}
      </p>
    </div>
  );
}

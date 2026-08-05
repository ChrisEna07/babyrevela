"use client";

import { motion } from "framer-motion";
import type { Team, Vote, VoteTotals } from "@/lib/types";
import { fireVoteConfetti } from "@/lib/confetti";

interface VotePanelProps {
  myVote: Vote | undefined;
  totals: VoteTotals;
  onVote: (team: Team) => void;
}

export function VotePanel({ myVote, totals, onVote }: VotePanelProps) {
  const vote = (team: Team) => {
    fireVoteConfetti(team);
    onVote(team);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <h2 className="text-center font-display text-2xl text-ink sm:text-3xl">
        ¡Elige tu equipo!
      </h2>

      <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => vote("boy")}
          className={`relative flex flex-col items-center gap-1.5 rounded-3xl border-4 p-4 text-center transition sm:gap-2 sm:p-6 ${
            myVote?.team === "boy"
              ? "border-gold bg-gradient-to-b from-baby-blue to-baby-blue-dark text-white shadow-xl shadow-baby-blue/50"
              : "border-baby-blue-light bg-white/80 text-ink shadow-md hover:shadow-lg"
          }`}
        >
          <span className="text-4xl sm:text-5xl">👦</span>
          <span className="font-display text-xl sm:text-2xl">Team Niño</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold sm:px-3 sm:text-xs ${
              myVote?.team === "boy" ? "bg-white/25" : "bg-baby-blue-light"
            }`}
          >
            {totals.boy} voto{totals.boy === 1 ? "" : "s"}
          </span>
          {myVote?.team === "boy" && (
            <motion.span
              layoutId="my-vote"
              className="absolute -top-3 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold text-white shadow sm:px-3 sm:py-1 sm:text-xs"
            >
              Tu voto ✓
            </motion.span>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => vote("girl")}
          className={`relative flex flex-col items-center gap-1.5 rounded-3xl border-4 p-4 text-center transition sm:gap-2 sm:p-6 ${
            myVote?.team === "girl"
              ? "border-gold bg-gradient-to-b from-baby-pink to-baby-pink-dark text-white shadow-xl shadow-baby-pink/50"
              : "border-baby-pink-light bg-white/80 text-ink shadow-md hover:shadow-lg"
          }`}
        >
          <span className="text-4xl sm:text-5xl">👧</span>
          <span className="font-display text-xl sm:text-2xl">Team Niña</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold sm:px-3 sm:text-xs ${
              myVote?.team === "girl" ? "bg-white/25" : "bg-baby-pink-light"
            }`}
          >
            {totals.girl} voto{totals.girl === 1 ? "" : "s"}
          </span>
          {myVote?.team === "girl" && (
            <motion.span
              layoutId="my-vote"
              className="absolute -top-3 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold text-white shadow sm:px-3 sm:py-1 sm:text-xs"
            >
              Tu voto ✓
            </motion.span>
          )}
        </motion.button>
      </div>

      <p className="text-center text-sm text-ink-soft">
        {myVote
          ? "Puedes cambiar tu voto cuando quieras mientras estén abiertas las votaciones."
          : "Toca tu favorito. Puedes cambiarlo después."}
      </p>
    </div>
  );
}

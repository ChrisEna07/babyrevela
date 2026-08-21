"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Team } from "@/lib/types";
import { fireRevealConfetti } from "@/lib/confetti";

const FLOATERS = ["💙", "💗", "✨", "🎀", "💛", "🦋", "🌟", "🍼"];

export function RevealScreen({
  team,
  myTeam,
  guestName,
  onHomeClick,
  onToggleStats,
}: {
  team: Team;
  myTeam?: Team;
  guestName?: string;
  onHomeClick?: () => void;
  onToggleStats?: () => void;
}) {
  const fired = useRef(false);
  const isBoy = team === "boy";
  const guessed = myTeam !== undefined && myTeam === team;

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fireRevealConfetti(team);

    // Play gender reveal celebration audio
    try {
      const songUrl = isBoy ? "/songreveal/Boysound.mp3" : "/songreveal/Grilsound.mp3";
      const audio = new Audio(songUrl);
      audio.volume = 0.95;
      audio.play().catch((err) => {
        console.log("Audio play blocked:", err);
      });
    } catch (e) {
      console.error("Audio playback error:", e);
    }

    // Trigger Notification if tab is in background
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(isBoy ? "¡ES UN NIÑO! 👦💙" : "¡ES UNA NIÑA! 👧💗", {
          body: "¡El momento más esperado ha llegado! Toca aquí para ver la celebración en vivo.",
          icon: isBoy ? "/gift/Its A Boy Baby GIF by Steve Harvey TV.gif" : "/gift/Girl Pink GIF by Shay Mitchell.gif",
          tag: "baby-reveal-announcement",
        });
      } catch (e) {
        console.error("Notification error:", e);
      }
    }
  }, [team, isBoy]);

  return (
    <div
      className={`relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12 transition-colors duration-1000 ${
        isBoy ? "bg-gradient-to-b from-baby-blue-light to-baby-blue" : "bg-gradient-to-b from-baby-pink-light to-baby-pink"
      }`}
    >
      {FLOATERS.map((emoji, index) => (
        <motion.span
          key={index}
          className="pointer-events-none absolute text-2xl opacity-60 sm:text-3xl"
          style={{
            left: `${8 + index * 11}%`,
            top: `${-8 + (index % 4) * 6}%`,
          }}
          animate={{ y: ["0vh", "105vh"], rotate: [0, 180] }}
          transition={{
            duration: 9 + (index % 5) * 2,
            repeat: Infinity,
            ease: "linear",
            delay: index * 0.8,
          }}
        >
          {emoji}
        </motion.span>
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.2 }}
        className="relative z-10 flex w-full flex-col items-center gap-4 rounded-3xl border-4 border-white bg-white/90 px-4 py-8 text-center shadow-2xl backdrop-blur sm:gap-6 sm:rounded-[2.5rem] sm:border-8 sm:px-8 sm:py-10"
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark sm:text-sm sm:tracking-[0.3em]"
        >
          ¡El gran momento!
        </motion.p>

        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 1.15, 1], opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.7, times: [0, 0.6, 1] }}
          className="flex flex-col items-center gap-3"
        >
          {/* Animated Gender Reveal GIF Sticker */}
          <div className="relative h-44 w-44 overflow-hidden rounded-full border-4 border-white shadow-xl bg-slate-100">
            <img
              src={
                isBoy
                  ? "/gift/Its A Boy Baby GIF by Steve Harvey TV.gif"
                  : "/gift/Girl Pink GIF by Shay Mitchell.gif"
              }
              alt="Gender Reveal Celebration GIF"
              className="h-full w-full object-cover"
            />
          </div>

          <span className="text-5xl sm:text-6xl animate-float-slow">
            {isBoy ? "👦💙" : "👧💗"}
          </span>
        </motion.div>

        <motion.h1
          initial={{ scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 150, damping: 12 }}
          className={`font-display text-4xl leading-tight sm:text-7xl ${
            isBoy ? "text-baby-blue-dark" : "text-baby-pink-dark"
          }`}
        >
          {isBoy ? "¡Es un NIÑO!" : "¡Es una NIÑA!"}
        </motion.h1>

        {guessed ? (
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 150, damping: 14 }}
            className="rounded-full bg-gold px-6 py-2 text-sm font-extrabold text-white shadow-md"
          >
            🎉 ¡Adivinaste! Tu intuición estuvo impecable ✨
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="rounded-full bg-pink-100 px-6 py-2 text-sm font-extrabold text-pink-700 shadow-sm"
          >
            💖 ¡Lo más hermoso es celebrar juntos este momento! 💫
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="max-w-md text-base font-extrabold leading-relaxed text-slate-800"
        >
          ¡Muchas gracias por acompañarnos y ser parte de este día especial{guestName ? `, ${guestName}` : ""}! 🎈✨
        </motion.p>

        {/* Action Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          {onToggleStats && (
            <button
              onClick={onToggleStats}
              className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-900 shadow transition hover:bg-amber-100"
            >
              📊 Ver Porcentajes de Votación
            </button>
          )}
          {onHomeClick && (
            <button
              onClick={onHomeClick}
              className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow transition hover:bg-slate-50"
            >
              🏠 Volver a Inicio (Landing Page)
            </button>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="text-xs font-bold tracking-wider text-slate-400"
        >
          Baby Revela • Desarrollado con ❤️ por <span className="font-extrabold text-slate-600">ChrizDev (Christian Romero)</span>
        </motion.p>
      </motion.div>
    </div>
  );
}

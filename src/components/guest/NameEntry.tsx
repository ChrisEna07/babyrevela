"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { EVENT_NAME, EVENT_TAGLINE } from "@/lib/constants";

export function NameEntry({
  onDone,
  activeGuestName,
  onGoToApp,
}: {
  onDone: (name: string) => void;
  activeGuestName?: string;
  onGoToApp?: () => void;
}) {
  const [name, setName] = useState("");
  const valid = name.trim().length >= 2;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-10">
      {/* Hero Header */}
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="flex items-center justify-center gap-3 text-5xl">
          <span className="animate-float-slow inline-block">👶</span>
          <span className="animate-pulse-gold inline-block text-4xl">✨</span>
          <span className="inline-block" style={{ animation: "float-slow 5s ease-in-out infinite reverse" }}>
            🍼
          </span>
        </div>

        <span className="rounded-full bg-amber-100 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-amber-800 shadow-sm">
          🎉 Experiencia de Revelación en Vivo
        </span>

        <h1 className="font-display text-5xl text-gold-dark sm:text-6xl">
          {EVENT_NAME}
        </h1>
        <p className="max-w-md text-base font-semibold text-slate-600 sm:text-lg">
          {EVENT_TAGLINE}
        </p>

        {activeGuestName && onGoToApp && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-2 flex flex-col items-center gap-2 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-center shadow-lg"
          >
            <p className="text-sm font-bold text-emerald-900">
              👋 ¡Hola, <span className="font-extrabold underline">{activeGuestName}</span>! Tienes tu sesión activa.
            </p>
            <button
              onClick={onGoToApp}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-extrabold text-white shadow transition hover:bg-emerald-700"
            >
              🎉 Entrar directamente al Evento en Vivo →
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Guest Name Entry Form */}
      <motion.form
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 130, damping: 16 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onDone(name.trim());
        }}
        className="flex w-full flex-col gap-4 rounded-[2rem] border-4 border-white bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✍️</span>
            <label
              htmlFor="nickname"
              className="text-xs font-extrabold uppercase tracking-wider text-slate-700 sm:text-sm"
            >
              Ingresa tu nombre o apodo para votar
            </label>
          </div>
          <span className="rounded-full bg-baby-blue-light px-3 py-1 text-xs font-extrabold text-baby-blue-dark">
            Invitado
          </span>
        </div>

        <input
          id="nickname"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Tía Mary 🌟"
          maxLength={24}
          className="w-full rounded-2xl border-2 border-baby-pink-light bg-slate-50 px-4 py-3.5 text-lg font-semibold text-slate-800 outline-none transition focus:border-baby-pink focus:bg-white focus:ring-4 focus:ring-baby-pink/30"
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={!valid}
          className="w-full rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 py-4 text-lg font-extrabold text-white shadow-xl transition hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-40"
        >
          ¡Entrar a votar! 💙💗
        </motion.button>

        <p className="text-center text-xs font-semibold text-slate-500">
          Requerido para registrar tu voto e interactuar en la gran revelación.
        </p>
      </motion.form>

      {/* How It Works Steps */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-baby-blue-light bg-white/80 p-4 text-center shadow-md">
          <span className="text-3xl">1️⃣</span>
          <h3 className="font-bold text-slate-800 text-sm">Ingresa tu apodo</h3>
          <p className="text-xs font-medium text-slate-500">
            Regístrate rápidamente sin contraseñas ni registros largos.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-baby-pink-light bg-white/80 p-4 text-center shadow-md">
          <span className="text-3xl">2️⃣</span>
          <h3 className="font-bold text-slate-800 text-sm">Vota tu predicción</h3>
          <p className="text-xs font-medium text-slate-500">
            Elige Team Niño 👦 o Team Niña 👧 y sigue los porcentajes en vivo.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-amber-200 bg-white/80 p-4 text-center shadow-md">
          <span className="text-3xl">3️⃣</span>
          <h3 className="font-bold text-slate-800 text-sm">¡Revelación en vivo!</h3>
          <p className="text-xs font-medium text-slate-500">
            Vive la cuenta regresiva sincronizada con confetti en pantalla.
          </p>
        </div>
      </motion.section>

      {/* Roles & Organization Access */}
      <motion.section
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex w-full flex-col gap-3 rounded-3xl border-2 border-slate-200 bg-white/90 p-5 shadow-lg backdrop-blur"
      >
        <div className="text-center sm:text-left">
          <h2 className="flex items-center justify-center gap-2 font-display text-xl text-slate-800 sm:justify-start">
            <span>⚙️</span> Paneles de Organización del Evento
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Acceso exclusivo para administradores y organizadores:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Card Anfitrión & Revelador */}
          <Link
            href="/admin"
            className="flex flex-col justify-between rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4 shadow transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl">🎤</span>
                <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                  Anfitrión & Revelador
                </span>
              </div>
              <h3 className="mt-2 font-extrabold text-slate-800 text-base">
                Panel del Anfitrión
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-600">
                Abre y cierra votaciones, configura el contador y activa la revelación en vivo.
              </p>
            </div>
            <span className="mt-4 block w-full rounded-xl bg-emerald-600 py-2 text-center text-xs font-bold text-white shadow transition hover:bg-emerald-700">
              Ingreso Anfitrión →
            </span>
          </Link>

          {/* Card Súper Admin */}
          <Link
            href="/superadmin"
            className="flex flex-col justify-between rounded-2xl border-2 border-purple-200 bg-purple-50/50 p-4 shadow transition hover:-translate-y-0.5 hover:border-purple-400 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl">👑</span>
                <span className="rounded-full bg-purple-200 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-800">
                  Súper Admin
                </span>
              </div>
              <h3 className="mt-2 font-extrabold text-slate-800 text-base">
                Súper Administración
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-600">
                Dashboard completo con gráfico de votos por minuto y métricas avanzadas.
              </p>
            </div>
            <span className="mt-4 block w-full rounded-xl bg-purple-600 py-2 text-center text-xs font-bold text-white shadow transition hover:bg-purple-700">
              Ingreso Súper Admin →
            </span>
          </Link>
        </div>
      </motion.section>

      {/* Developer Footer */}
      <footer className="text-center">
        <p className="text-xs font-bold text-slate-500">
          Baby Revela • Desarrollado con ❤️ por{" "}
          <span className="font-extrabold text-gold-dark">ChrizDev</span>
        </p>
      </footer>
    </div>
  );
}

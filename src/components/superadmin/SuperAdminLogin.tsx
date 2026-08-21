"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { validateSuperAdminCredentials } from "@/lib/db";

export function SuperAdminLogin({
  onSuccess,
}: {
  onSuccess: (name: string, pinHash: string) => void;
}) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2 || pin.trim().length < 4 || busy) return;

    setBusy(true);
    setError(false);
    try {
      const res = await validateSuperAdminCredentials(name, pin);
      if (res.valid) {
        onSuccess(res.name, res.pinHash);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <p className="text-5xl">👑</p>
        <h1 className="mt-3 font-display text-3xl text-gold-dark">
          Súper administrador
        </h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Acceso restringido. Ingresa tu usuario y PIN.
        </p>
      </motion.div>

      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={submit}
        className="flex w-full flex-col gap-4 rounded-3xl border-2 border-baby-blue-light bg-white/80 p-6 shadow-lg shadow-baby-blue/30 backdrop-blur"
      >
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(false);
          }}
          placeholder="Nombre de súper administrador"
          autoCapitalize="words"
          className="w-full rounded-2xl border-2 border-baby-blue-light bg-baby-blue-light/40 px-4 py-3 text-lg font-semibold text-ink outline-none transition focus:border-baby-blue focus:bg-white"
        />
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          onChange={(event) => {
            setPin(event.target.value);
            setError(false);
          }}
          placeholder="PIN"
          className="w-full rounded-2xl border-2 border-baby-pink-light bg-baby-pink-light/40 px-4 py-3 text-center text-lg font-bold tracking-[0.4em] text-ink outline-none transition focus:border-baby-pink focus:bg-white"
        />
        {error && (
          <p className="text-center text-sm font-bold text-red-500">
            Credenciales incorrectas.
          </p>
        )}
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 py-3.5 text-base font-extrabold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Verificando…" : "Entrar al Panel Súper Admin 👑"}
        </motion.button>

        <div className="mt-2 flex flex-col gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-3 text-center">
          <p className="text-xs font-bold text-slate-600">Navegar a otros paneles:</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              🏠 Modo Invitado
            </Link>
            <Link
              href="/admin"
              className="rounded-xl border border-emerald-300 bg-emerald-50 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
            >
              🎤 Panel Anfitrión
            </Link>
          </div>
        </div>
      </motion.form>
    </div>
  );
}

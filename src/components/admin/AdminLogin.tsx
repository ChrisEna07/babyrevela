"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getHostInfo } from "@/lib/db";
import { sha256Hex } from "@/lib/hash";

export function AdminLogin({ onSuccess }: { onSuccess: (pinHash: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hostInfo, setHostInfo] = useState<{ hostName: string | null; pinHash: string | null } | null>(null);
  const [loadingHost, setLoadingHost] = useState(true);

  useEffect(() => {
    getHostInfo()
      .then((info) => setHostInfo(info))
      .finally(() => setLoadingHost(false));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pin.trim().length < 4 || busy) return;

    setBusy(true);
    setError(null);
    try {
      const hash = await sha256Hex(pin.trim());
      const currentHost = await getHostInfo();

      if (!currentHost.pinHash) {
        setError("🔒 El Anfitrión aún no ha configurado sus credenciales. Solicita al Súper Admin tu enlace de registro (/setup-admin).");
        return;
      }

      if (currentHost.pinHash === hash) {
        onSuccess(hash);
      } else {
        setError("❌ PIN incorrecto. Este panel está restringido al Anfitrión del evento.");
      }
    } catch {
      setError("Ocurrió un error al verificar tus credenciales.");
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
        <p className="text-5xl">🎤</p>
        <h1 className="mt-3 font-display text-3xl text-gold-dark">Panel del Anfitrión</h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Acceso exclusivo para el Anfitrión del evento.
        </p>
      </motion.div>

      {/* Host Credentials Info Banner */}
      {!loadingHost && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full text-center"
        >
          {hostInfo?.pinHash ? (
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/80 p-3 shadow-sm">
              <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-900">
                Anfitrión del Evento:
              </span>
              <p className="font-display text-lg text-emerald-950 mt-0.5">
                {hostInfo.hostName || "Anfitrión Asignado"} 👑
              </p>
              <p className="text-[11px] font-semibold text-emerald-800">
                Ingresa tu PIN personal de 4 dígitos para controlar la revelación.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-3 shadow-sm">
              <span className="text-xs font-extrabold uppercase tracking-wide text-amber-900">
                ⚠️ Esperando Registro de Anfitrión
              </span>
              <p className="mt-1 text-xs font-semibold text-amber-800 leading-relaxed">
                El Súper Admin debe enviar el enlace seguro de registro (/setup-admin) al Anfitrión antes de ingresar.
              </p>
            </div>
          )}
        </motion.div>
      )}

      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={submit}
        className="flex w-full flex-col gap-4 rounded-3xl border-2 border-baby-blue-light bg-white/80 p-6 shadow-lg shadow-baby-blue/30 backdrop-blur"
      >
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          onChange={(event) => {
            setPin(event.target.value);
            setError(null);
          }}
          disabled={!hostInfo?.pinHash}
          placeholder="PIN secreto de Anfitrión"
          className="w-full rounded-2xl border-2 border-baby-pink-light bg-baby-pink-light/40 px-4 py-3 text-center text-lg font-bold tracking-[0.4em] text-ink outline-none transition focus:border-baby-pink focus:bg-white disabled:opacity-50"
        />
        {error && (
          <p className="text-center text-xs font-bold text-red-500 leading-relaxed">
            {error}
          </p>
        )}
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="submit"
          disabled={busy || pin.trim().length < 4 || !hostInfo?.pinHash}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 py-3.5 text-base font-extrabold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Verificando…" : "Entrar al Panel de Anfitrión 🎤"}
        </motion.button>

        <div className="mt-2 flex flex-col gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-3 text-center">
          <p className="text-xs font-bold text-slate-600">Navegar a otros roles de la app:</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              🏠 Modo Invitado
            </Link>
            <Link
              href="/superadmin"
              className="rounded-xl border border-purple-300 bg-purple-50 py-2 text-xs font-bold text-purple-700 shadow-sm transition hover:bg-purple-100"
            >
              👑 Súper Admin
            </Link>
          </div>
        </div>
      </motion.form>
    </div>
  );
}

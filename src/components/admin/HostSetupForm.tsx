"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { completeHostSetup, getHostSetupTokenInfo } from "@/lib/db";
import { sha256Hex } from "@/lib/hash";

export function HostSetupForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);
  const [hostName, setHostName] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    getHostSetupTokenInfo()
      .then((info) => {
        if (!isMounted) return;
        if (info && info.token === token && info.active) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      })
      .catch(() => {
        if (isMounted) setTokenValid(false);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hostName.trim().length < 2) {
      setErrorMsg("Por favor escribe tu nombre o apodo.");
      return;
    }
    if (pin.length < 4) {
      setErrorMsg("El PIN debe tener al menos 4 dígitos numéricos.");
      return;
    }
    if (pin !== pinConfirm) {
      setErrorMsg("Los dos campos de PIN no coinciden.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const pinHash = await sha256Hex(pin.trim());
      await completeHostSetup(token, hostName.trim(), pinHash);
      setSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Error al guardar credenciales.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="font-extrabold text-slate-600 animate-pulse">
          Validando enlace de configuración seguro…
        </p>
      </div>
    );
  }

  if (!tokenValid && !success) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex w-full flex-col items-center gap-4 rounded-3xl border-2 border-red-200 bg-white p-6 shadow-xl"
        >
          <span className="text-5xl">⚠️</span>
          <h2 className="font-display text-2xl text-red-600">
            Enlace de Configuración Inválido
          </h2>
          <p className="text-xs font-semibold leading-relaxed text-slate-600">
            Este enlace de configuración para el anfitrión no es válido, ha caducado o ya fue utilizado por razones de seguridad para prevenir filtraciones.
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Solicita al Súper Administrador que genere un nuevo enlace seguro desde su panel.
          </p>
          <Link
            href="/"
            className="rounded-2xl bg-slate-800 px-6 py-3 font-extrabold text-white shadow"
          >
            🏠 Ir a Inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex w-full flex-col items-center gap-4 rounded-3xl border-2 border-emerald-300 bg-white p-6 shadow-2xl"
        >
          <span className="text-5xl">🔐✨</span>
          <h2 className="font-display text-2xl text-emerald-900">
            ¡Credenciales Configuradas con Éxito!
          </h2>
          <p className="text-sm font-semibold text-emerald-800">
            Hola <strong>{hostName}</strong>, tu PIN privado ha sido registrado en la base de datos de forma encriptada (SHA-256). Nadie más conoce tu clave.
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Guarda bien tu PIN ({pin}) para ingresar al panel de control durante la revelación.
          </p>
          <Link
            href="/admin"
            className="w-full rounded-2xl bg-emerald-600 py-3.5 font-extrabold text-white shadow-lg transition hover:bg-emerald-700"
          >
            🎤 Ir al Panel de Anfitrión (/admin) →
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center flex flex-col gap-2"
      >
        <span className="text-4xl">🔐</span>
        <h1 className="font-display text-3xl text-gold-dark">
          Configuración Privada del Anfitrión
        </h1>
        <p className="text-xs font-semibold text-slate-600">
          Crea tus credenciales de acceso para este evento sin riesgo de filtraciones.
        </p>
      </motion.div>

      <motion.form
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-4 rounded-3xl border-4 border-white bg-white/95 p-6 shadow-2xl backdrop-blur"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            Tu nombre o apodo (Anfitrión):
          </label>
          <input
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="Ej. Anfitrión Carlos 🎤"
            maxLength={24}
            required
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            Crea tu PIN secreto de 4 dígitos:
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="****"
            maxLength={8}
            required
            className="w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-center font-bold tracking-[0.3em] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            Confirma tu PIN secreto:
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="****"
            maxLength={8}
            required
            className="w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-center font-bold tracking-[0.3em] text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </div>

        {errorMsg && (
          <p className="text-center text-xs font-bold text-rose-500">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 font-extrabold text-white shadow-lg transition hover:shadow-xl disabled:opacity-40"
        >
          {saving ? "Registrando credenciales…" : "🔒 Registrar Credenciales Privadas"}
        </button>
      </motion.form>
    </div>
  );
}

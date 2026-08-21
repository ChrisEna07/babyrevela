"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  adminCloseVoting,
  adminOpenVoting,
  adminReset,
  adminStartReveal,
  computeTotals,
  setEventCancellation,
  setHostRevealTime,
  subscribeEventCancellation,
  subscribeEventSchedule,
  subscribeRSVPs,
  subscribeState,
  subscribeVotes,
} from "@/lib/db";
import type { AppState, EventCancellation, EventSchedule, RSVP, Team, VoteMap } from "@/lib/types";
import { COUNTDOWN_OPTIONS, DEFAULT_COUNTDOWN } from "@/lib/constants";
import { ConnectionPill } from "@/components/shared/ConnectionPill";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { PercentageBar } from "@/components/guest/PercentageBar";
import { QRCodeCard } from "@/components/shared/QRCodeCard";

const PHASE_LABELS: Record<AppState["phase"], string> = {
  idle: "En espera",
  voting: "Votaciones abiertas",
  countdown: "Cuenta regresiva",
  revealed: "¡Revelado!",
};

export function AdminPanel({
  pinHash,
  onLogout,
}: {
  pinHash: string;
  onLogout: () => void;
}) {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [votes, setVotes] = useState<VoteMap>({});
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [duration, setDuration] = useState(DEFAULT_COUNTDOWN);
  const [pick, setPick] = useState<Team | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Schedule States
  const [schedule, setSchedule] = useState<EventSchedule | null>(null);
  const [revealTimeInput, setRevealTimeInput] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Cancellation States
  const [cancellation, setCancellation] = useState<EventCancellation | null>(null);
  const [cancelStatus, setCancelStatus] = useState<"activo" | "aplazado" | "cancelado">("activo");
  const [cancelReason, setCancelReason] = useState("");
  const [savingCancellation, setSavingCancellation] = useState(false);

  // Modern UI feedback states
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const offState = subscribeState(setAppState);
    const offVotes = subscribeVotes(setVotes);
    const offRsvps = subscribeRSVPs(setRsvps);
    const offSchedule = subscribeEventSchedule((sched) => {
      setSchedule(sched);
      if (sched?.revealTime) {
        setRevealTimeInput(sched.revealTime);
      }
    });
    const offCancel = subscribeEventCancellation((c) => {
      setCancellation(c);
      if (c) {
        setCancelStatus(c.status);
        setCancelReason(c.reason || "");
      } else {
        setCancelStatus("activo");
        setCancelReason("");
      }
    });
    return () => {
      offState();
      offVotes();
      offRsvps();
      offSchedule();
      offCancel();
    };
  }, []);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingSchedule || !revealTimeInput.trim()) return;
    setSavingSchedule(true);
    try {
      await setHostRevealTime(revealTimeInput);
      setToastMessage("🔥 ¡Hora de la revelación guardada y sincronizada!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setToastMessage("Error al guardar la hora de la revelación.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSaveCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCancellation(true);
    try {
      await setEventCancellation(cancelStatus, cancelReason);
      setToastMessage(
        cancelStatus === "activo"
          ? "✓ Estado del evento restablecido a Activo."
          : `📢 Estado "${cancelStatus.toUpperCase()}" informado a los invitados.`
      );
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setToastMessage("Error al publicar estado del evento.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSavingCancellation(false);
    }
  };

  const totals = useMemo(() => computeTotals(votes), [votes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const run = async (label: string, action: () => Promise<void>) => {
    if (busy) return;
    setBusy(label);
    try {
      await action();
    } catch (error) {
      console.error(error);
      showToast("No se pudo actualizar el estado. Revisa tu conexión.");
    } finally {
      setBusy(null);
    }
  };

  const handleResetConfirm = async () => {
    setConfirmResetOpen(false);
    await run("reset", () => adminReset(pinHash));
    setPick(null);
    showToast("✓ Evento restablecido y votos limpiados exitosamente.");
  };

  if (appState === null) {
    return <FullPageLoader label="Sincronizando estado…" />;
  }

  const isVoting = appState.phase === "voting";
  const isCountdown = appState.phase === "countdown";
  const isRevealed = appState.phase === "revealed";

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 z-50 -translate-x-1/2 rounded-2xl border-2 border-amber-300 bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-gold-dark">Panel de anfitrión</h1>
          <p className="text-sm font-semibold text-ink-soft">
            Control de votaciones y revelación en vivo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionPill />
          <button
            onClick={onLogout}
            className="rounded-full border-2 border-baby-pink-light bg-white px-4 py-1 text-xs font-bold text-ink-soft transition hover:border-baby-pink hover:text-ink"
          >
            Salir
          </button>
        </div>
      </header>

      {/* State Badge Banner */}
      <section className="flex flex-col gap-2 rounded-3xl border-2 border-amber-200 bg-white/80 p-5 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
            Estado Actual del Evento:
          </span>
          <p className="font-display text-2xl text-gold-dark font-extrabold">
            {PHASE_LABELS[appState.phase]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isVoting && (
            <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-extrabold text-emerald-800 animate-pulse border border-emerald-300">
              🟢 Votación Activa
            </span>
          )}
          {isCountdown && (
            <span className="rounded-full bg-amber-100 px-3.5 py-1 text-xs font-extrabold text-amber-800 animate-bounce border border-amber-300">
              ⏳ Conteo en Progreso
            </span>
          )}
          {isRevealed && (
            <span className="rounded-full bg-purple-100 px-3.5 py-1 text-xs font-extrabold text-purple-800 border border-purple-300">
              🎉 Evento Revelado
            </span>
          )}
        </div>
      </section>

      {/* Dynamic Status Feedback Cards */}
      {isRevealed && (
        <div
          className={`rounded-3xl p-6 text-center shadow-xl text-white ${
            appState.revealChoice === "boy"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600"
              : "bg-gradient-to-r from-pink-500 to-purple-600"
          }`}
        >
          <p className="font-display text-3xl">
            {appState.revealChoice === "boy" ? "¡Es un NIÑO! 👦" : "¡Es una NIÑA! 👧"}
          </p>
          <p className="mt-1 text-sm font-semibold text-white/85">
            La revelación se disparó en vivo para todos los invitados.
          </p>
        </div>
      )}

      {/* 🗓️ Programación de Hora de Revelación (Anfitrión) */}
      <section className="rounded-3xl border-2 border-amber-300 bg-amber-50/90 p-5 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-amber-950">
              <span>🔥</span> Hora de Inicio de la Revelación en Vivo (Anfitrión)
            </h2>
            <p className="text-xs font-semibold text-amber-900/90">
              Asigna la hora exacta en que iniciarás la revelación. La fecha y hora de la reunión presencial son administradas por el Súper Admin.
            </p>
          </div>
          {schedule?.revealTime && (
            <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-black text-emerald-950 border border-emerald-300">
              ✓ Hora Fijada: {schedule.revealTime}
            </span>
          )}
        </div>

        {/* Info Tags from Super Admin */}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs font-semibold">
          <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-amber-200 shadow-sm">
            <span>🗓️ Fecha Evento (Súper Admin):</span>
            <strong className="text-amber-950">{schedule?.eventDate || "Pendiente por Súper Admin"}</strong>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-amber-200 shadow-sm">
            <span>🎟️ Inicio Reunión (Súper Admin):</span>
            <strong className="text-amber-950">{schedule?.eventTime || "Pendiente por Súper Admin"}</strong>
          </div>
        </div>

        <form onSubmit={handleSaveSchedule} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
              🔥 Hora de Inicio de la Revelación de Sexo (En Vivo):
            </label>
            <input
              type="text"
              value={revealTimeInput}
              onChange={(e) => setRevealTimeInput(e.target.value)}
              placeholder="Ej. 6:30 PM"
              required
              className="w-full rounded-2xl border-2 border-amber-400 bg-white px-4 py-3 text-sm font-black text-amber-950 shadow-sm outline-none focus:border-amber-600"
            />
          </div>

          <button
            type="submit"
            disabled={savingSchedule}
            className="w-full rounded-2xl bg-amber-600 py-3 font-extrabold text-white shadow-md transition hover:bg-amber-700 disabled:opacity-50"
          >
            {savingSchedule ? "Guardando Hora…" : "💾 Guardar Hora de Revelación y Sincronizar Invitaciones"}
          </button>
        </form>
      </section>

      {/* 📢 Módulo de Aplazamiento o Cancelación del Evento */}
      <section className="rounded-3xl border-2 border-rose-300 bg-rose-50/90 p-5 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between border-b border-rose-200 pb-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-rose-950">
              <span>🚨</span> Aplazar o Cancelar Evento (Comunicado a Invitados)
            </h2>
            <p className="text-xs font-semibold text-rose-900/90">
              Si requieres aplazar o cancelar la fecha u hora, publica un aviso oficial que aparecerá de inmediato en la pantalla de todos los invitados.
            </p>
          </div>
          {cancellation?.status && cancellation.status !== "activo" && (
            <span className="rounded-full bg-rose-200 px-3 py-1 text-xs font-black text-rose-950 border border-rose-300 uppercase">
              {cancellation.status}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveCancellation} className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-extrabold text-rose-950 uppercase tracking-wide">
                Estado del Evento:
              </label>
              <select
                value={cancelStatus}
                onChange={(e) => setCancelStatus(e.target.value as "activo" | "aplazado" | "cancelado")}
                className="rounded-xl border border-rose-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-sm outline-none focus:border-rose-500"
              >
                <option value="activo">🟢 Normal / Activo (Sin cambios)</option>
                <option value="aplazado">⏳ Aplazado (Postergado)</option>
                <option value="cancelado">🚫 Cancelado</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-extrabold text-rose-950 uppercase tracking-wide">
                Motivo / Comunicado Oficial:
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej. Aplazado por motivos de fuerza mayor"
                className="rounded-xl border border-rose-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-sm outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingCancellation}
            className="w-full rounded-2xl bg-rose-600 py-3 font-extrabold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-50"
          >
            {savingCancellation ? "Publicando Aviso…" : "📢 Informar Estado a Todos los Invitados"}
          </button>
        </form>
      </section>

      {/* 1. Control de Votaciones y Dashboard Live */}
      <section className="rounded-3xl border-2 border-baby-blue-light bg-white/90 p-5 shadow-md backdrop-blur">
        <h2 className="mb-3 font-display text-xl text-ink">1 · Control de Votaciones 📊</h2>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={isVoting || busy !== null || isRevealed}
            onClick={() => void run("open", () => adminOpenVoting(pinHash))}
            className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 font-extrabold text-white shadow transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isVoting ? "✓ Votaciones Abiertas" : "Abrir votaciones"}
          </button>
          <button
            disabled={!isVoting || busy !== null}
            onClick={() => void run("close", () => adminCloseVoting(pinHash))}
            className="flex-1 rounded-2xl bg-slate-500 px-4 py-3 font-extrabold text-white shadow transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cerrar votaciones
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Avance de Votos en Tiempo Real
          </h3>
          <PercentageBar totals={totals} />
        </div>
      </section>

      {/* Monitor de Invitados y Votación en Vivo */}
      <section className="rounded-3xl border-2 border-indigo-200 bg-indigo-50/70 p-5 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-indigo-950">
              <span>👥</span> Monitor de Votación de Invitados
            </h2>
            <p className="text-xs font-semibold text-indigo-800/90">
              Visualiza en tiempo real quiénes ya votaron y quiénes faltan por votar antes de cerrar la votación.
            </p>
          </div>
          <span className="rounded-full bg-indigo-200 px-3 py-1 text-xs font-black text-indigo-900">
            {totals.total} {totals.total === 1 ? "Voto" : "Votos"} Registrados
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Lista de Votantes Confirmados */}
            <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-white p-3.5 shadow-sm">
              <span className="text-xs font-extrabold text-emerald-900 flex items-center justify-between">
                <span>🟢 Invitados que YA VOTARON</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
                  {Object.values(votes).filter((v) => v && (v.team === "boy" || v.team === "girl")).length}
                </span>
              </span>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {Object.values(votes).filter((v) => v && (v.team === "boy" || v.team === "girl")).length === 0 ? (
                  <p className="text-[11px] font-medium text-slate-400 italic py-2 text-center">
                    Aún no hay votos registrados.
                  </p>
                ) : (
                  Object.values(votes)
                    .filter((v) => v && (v.team === "boy" || v.team === "girl"))
                    .map((vote, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5 border border-slate-100"
                      >
                        <span className="font-bold text-slate-800">{vote.name}</span>
                        <span className="text-xs font-black flex items-center gap-1">
                          {vote.team === "boy" ? "💙 Niño" : "💗 Niña"}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Lista de RSVPs Registrados */}
            <div className="flex flex-col gap-2 rounded-2xl border border-purple-200 bg-white p-3.5 shadow-sm">
              <span className="text-xs font-extrabold text-purple-900 flex items-center justify-between">
                <span>📩 RSVPs Confirmados ({rsvps.filter((r) => r.attending).length})</span>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] text-purple-800">
                  Asistencia
                </span>
              </span>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {rsvps.filter((r) => r.attending).length === 0 ? (
                  <p className="text-[11px] font-medium text-slate-400 italic py-2 text-center">
                    No hay RSVPs confirmados registrados aún.
                  </p>
                ) : (
                  rsvps
                    .filter((r) => r.attending)
                    .map((rsvp) => {
                      const hasVoted = Object.values(votes).some(
                        (v) => v && v.name.toLowerCase().trim() === rsvp.name.toLowerCase().trim()
                      );
                      return (
                        <div
                          key={rsvp.id}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5 border border-slate-100"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{rsvp.name}</span>
                            <span className="text-[10px] font-medium text-slate-500">
                              {rsvp.mode === "remota" ? "🌐 Asistencia Remota" : `🎟️ Presencial (${rsvp.guestsCount} pers.)`}
                            </span>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              hasVoted
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {hasVoted ? "✓ Ya Votó" : "⏳ Pendiente"}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Código QR para los invitados */}
      <QRCodeCard title="📱 Código QR para los Invitados" url="https://babyrevela.vercel.app/" />

      {/* 2. Revelación y Cuenta Regresiva Automática */}
      <section className="rounded-3xl border-4 border-gold bg-white/90 p-5 shadow-xl backdrop-blur">
        <h2 className="mb-1 font-display text-xl text-gold-dark">
          2 · Revelación del Sexo 🎉
        </h2>
        <p className="mb-4 text-xs font-semibold text-slate-500">
          Selecciona el sexo real y la duración de la cuenta regresiva. Al presionar el botón, la cuenta regresiva se iniciará automáticamente en vivo en todas las pantallas.
        </p>

        {/* Duración */}
        <div className="mb-4 flex flex-col gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
            Duración de la cuenta regresiva:
          </span>
          <div className="flex flex-wrap gap-2">
            {COUNTDOWN_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setDuration(option)}
                disabled={busy !== null || isRevealed}
                className={`rounded-full px-4 py-2 text-xs font-extrabold transition disabled:opacity-40 ${
                  duration === option
                    ? "bg-slate-800 text-white shadow"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option} segundos
              </button>
            ))}
          </div>
        </div>

        {/* Selección de sexo */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPick("boy")}
            disabled={isRevealed}
            className={`flex flex-col items-center gap-1 rounded-2xl border-4 p-4 font-bold transition disabled:opacity-40 ${
              pick === "boy"
                ? "border-gold bg-gradient-to-b from-baby-blue to-baby-blue-dark text-white shadow-lg"
                : "border-baby-blue-light bg-white text-ink hover:shadow-md"
            }`}
          >
            <span className="text-4xl">👦</span>
            <span className="font-display text-lg">Niño</span>
          </button>
          <button
            onClick={() => setPick("girl")}
            disabled={isRevealed}
            className={`flex flex-col items-center gap-1 rounded-2xl border-4 p-4 font-bold transition disabled:opacity-40 ${
              pick === "girl"
                ? "border-gold bg-gradient-to-b from-baby-pink to-baby-pink-dark text-white shadow-lg"
                : "border-baby-pink-light bg-white text-ink hover:shadow-md"
            }`}
          >
            <span className="text-4xl">👧</span>
            <span className="font-display text-lg">Niña</span>
          </button>
        </div>

        {/* Botón principal de Revelación */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => void run("reveal", () => adminStartReveal(pick!, duration, pinHash))}
          disabled={!pick || isRevealed || busy !== null}
          className={`mt-5 w-full rounded-2xl py-4 text-lg font-extrabold text-white shadow-xl transition disabled:cursor-not-allowed disabled:opacity-40 ${
            pick
              ? "bg-gradient-to-r from-amber-500 via-gold-dark to-amber-600 animate-pulse-gold hover:opacity-95"
              : "bg-slate-300"
          }`}
        >
          {isRevealed
            ? "¡Revelación Activada!"
            : isCountdown
              ? "⏳ Cuenta regresiva en curso…"
              : pick
                ? `🔥 INICIAR REVELACIÓN DE ${pick === "boy" ? "NIÑO" : "NIÑA"} (${duration}s)`
                : "Elige Niño 👦 o Niña 👧 para revelar"}
        </motion.button>
      </section>

      {/* Botón Restablecer */}
      <button
        disabled={busy !== null}
        onClick={() => setConfirmResetOpen(true)}
        className="rounded-2xl border-2 border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-500 shadow-sm transition hover:border-red-300 hover:bg-red-50 disabled:opacity-40"
      >
        Restablecer todo el evento y borrar votos
      </button>

      {/* Modal de confirmación moderno para restablecer */}
      <AnimatePresence>
        {confirmResetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setConfirmResetOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-md flex-col gap-4 rounded-3xl border-4 border-rose-500 bg-white p-6 text-center shadow-2xl"
            >
              <span className="text-4xl animate-bounce">🚨</span>
              <h3 className="font-display text-2xl text-rose-950">
                ¿Confirmas el Borrado TOTAL del Evento e Invitados?
              </h3>
              <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-left text-xs font-semibold text-rose-900 space-y-1.5">
                <p className="font-black text-rose-950">⚠️ Esta acción eliminará permanentemente:</p>
                <p>• 🗑️ <strong>Toda la lista de invitados confirmados (RSVPs y mensajes).</strong></p>
                <p>• 🗳️ <strong>Todos los votos y registros acumulados.</strong></p>
                <p>• 📊 <strong>El estado actual y avisos de cancelación/aplazamiento.</strong></p>
                <p className="pt-1 text-slate-700">La aplicación volverá a quedar 100% limpia para empezar de cero.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmResetOpen(false)}
                  className="flex-1 rounded-2xl bg-slate-100 py-3 text-xs font-extrabold text-slate-700 transition hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetConfirm}
                  className="flex-1 rounded-2xl bg-rose-600 py-3 text-xs font-black text-white shadow transition hover:bg-rose-700"
                >
                  🔥 Sí, Restablecer Todo y Borrar Invitados
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2 rounded-2xl border-2 border-slate-200 bg-white/90 p-4 text-center shadow-md">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
          Navegación entre Roles
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <span>🏠</span> Vista Invitado
          </Link>
          <Link
            href="/superadmin"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 py-2.5 text-xs font-bold text-purple-700 shadow-sm transition hover:bg-purple-100"
          >
            <span>👑</span> Súper Admin
          </Link>
        </div>
      </div>
    </div>
  );
}

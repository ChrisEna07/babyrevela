"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  adminReset,
  computeTotals,
  createHostSetupLink,
  getHostInfo,
  resetHostCredentials,
  setParentsNames,
  subscribeEventSchedule,
  subscribeHistory,
  subscribeParentsNames,
  subscribeRSVPs,
  subscribeState,
  subscribeVoteLog,
  subscribeVotes,
} from "@/lib/db";
import type {
  AppState,
  EventSchedule,
  HistoricalSession,
  RSVP,
  Team,
  VoteLogEntry,
  VoteMap,
} from "@/lib/types";
import { APP_DOMAIN } from "@/lib/constants";
import { ConnectionPill } from "@/components/shared/ConnectionPill";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { PercentageBar } from "@/components/guest/PercentageBar";
import { VoteTimeline } from "./VoteTimeline";
import { RevelationSimulatorModal } from "./RevelationSimulatorModal";

const TEAM_EMOJI: Record<Team, string> = { boy: "💙", girl: "💗" };
const TEAM_LABEL: Record<Team, string> = { boy: "Niño", girl: "Niña" };

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-3xl border-2 bg-white/85 p-4 shadow-md ${accent}`}
    >
      <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      <span className="font-display text-3xl text-ink">{value}</span>
    </div>
  );
}

export function SuperAdminPanel({
  session,
  onLogout,
}: {
  session: { name: string; pinHash: string };
  onLogout: () => void;
}) {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [votes, setVotes] = useState<VoteMap>({});
  const [log, setLog] = useState<VoteLogEntry[]>([]);
  const [history, setHistory] = useState<HistoricalSession[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [parentsNamesInput, setParentsNamesInput] = useState<string>("Mamá & Papá");
  const [schedule, setSchedule] = useState<EventSchedule | null>(null);
  const [savingParents, setSavingParents] = useState(false);

  const [setupLink, setSetupLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [hostInfo, setHostInfo] = useState<{ hostName: string | null; pinHash: string | null } | null>(null);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshHostInfo = () => {
    getHostInfo().then(setHostInfo);
  };

  useEffect(() => {
    refreshHostInfo();
    const offState = subscribeState((state) => {
      setAppState(state);
      refreshHostInfo();
    });
    const offVotes = subscribeVotes(setVotes);
    const offLog = subscribeVoteLog(setLog);
    const offHistory = subscribeHistory(setHistory);
    const offRSVPs = subscribeRSVPs(setRsvps);
    const offParents = subscribeParentsNames(setParentsNamesInput);
    const offSchedule = subscribeEventSchedule(setSchedule);
    return () => {
      offState();
      offVotes();
      offLog();
      offHistory();
      offRSVPs();
      offParents();
      offSchedule();
    };
  }, []);

  const totals = useMemo(() => computeTotals(votes), [votes]);

  const voters = useMemo(
    () =>
      Object.values(votes)
        .filter((v) => v && (v.team === "boy" || v.team === "girl"))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 50),
    [votes]
  );

  const time = (ts: number) =>
    new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(
      new Date(ts)
    );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const MAX_CAPACITY = 20;

  const rsvpStats = useMemo(() => {
    const attendingList = rsvps.filter((r) => r.attending);
    const presencialList = attendingList.filter((r) => r.mode !== "remota");
    const remoteList = attendingList.filter((r) => r.mode === "remota");
    const presencialPeople = presencialList.reduce((sum, r) => sum + (r.guestsCount || 1), 0);
    const remotePeople = remoteList.length;
    return {
      confirmedCount: attendingList.length,
      declinedCount: rsvps.length - attendingList.length,
      totalPeople: presencialPeople + remotePeople,
      presencialPeople,
      remotePeople,
      presencialCapacityReached: presencialPeople >= MAX_CAPACITY,
    };
  }, [rsvps]);

  const handleSaveParents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentsNamesInput.trim()) return;
    setSavingParents(true);
    try {
      await setParentsNames(parentsNamesInput);
      showToast("✓ Nombres de los padres guardados con éxito.");
    } catch (err) {
      console.error(err);
      showToast("Error al guardar los nombres de los padres.");
    } finally {
      setSavingParents(false);
    }
  };

  const handleGenerateHostLink = async () => {
    setGeneratingLink(true);
    try {
      const token = await createHostSetupLink(session.pinHash);
      const fullUrl = `${APP_DOMAIN}/setup-admin?token=${token}`;
      setSetupLink(fullUrl);
      showToast("✓ Enlace seguro de configuración para el Anfitrión generado.");
    } catch (err) {
      console.error(err);
      showToast("Error al generar el enlace de configuración.");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleResetAndChangeHost = async () => {
    setGeneratingLink(true);
    try {
      await resetHostCredentials();
      const token = await createHostSetupLink(session.pinHash);
      const fullUrl = `${APP_DOMAIN}/setup-admin?token=${token}`;
      setSetupLink(fullUrl);
      showToast("✓ Credenciales del anfitrión anterior invalidadas. Nuevo enlace listo.");
    } catch (err) {
      console.error(err);
      showToast("Error al restablecer anfitrión.");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleSuperReset = async () => {
    setIsResetting(true);
    try {
      await adminReset(session.pinHash);
      setConfirmResetOpen(false);
      showToast("✓ Evento archivado e iniciado limpiamente.");
    } catch (err) {
      console.error(err);
      showToast("No se pudo restablecer el evento. Revisa tu conexión.");
    } finally {
      setIsResetting(false);
    }
  };

  if (appState === null) {
    return <FullPageLoader label="Cargando dashboard…" />;
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 z-50 -translate-x-1/2 rounded-2xl border-2 border-purple-300 bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-gold-dark">
            Súper administración
          </h1>
          <p className="text-sm font-semibold text-ink-soft">
            Sesión: <span className="text-gold-dark">{session.name}</span> 👑
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

      {/* 1. Módulo de Enlace Seguro para Anfitrión */}
      <section className="rounded-3xl border-2 border-emerald-200 bg-emerald-50/70 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl text-emerald-900">
              <span>🔐</span> Enlace Seguro para Anfitrión
            </h2>
            <span className="rounded-full bg-emerald-200 px-3 py-0.5 text-xs font-extrabold text-emerald-900">
              Prevención de Filtraciones
            </span>
          </div>
          <p className="text-xs font-semibold text-emerald-800/90 leading-relaxed">
            Genera un enlace privado único para que el anfitrión cree su propio usuario y PIN. Una vez creado, el control del evento es <strong>100% exclusivo del Anfitrión</strong>.
          </p>

          {/* Current Host Status Indicator */}
          {hostInfo?.pinHash ? (
            <div className="rounded-2xl border-2 border-emerald-300 bg-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                  ✅ Anfitrión Registrado:
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                  Acceso Privado Activo
                </span>
              </div>
              <p className="font-display text-lg text-emerald-950 mt-1">
                {hostInfo.hostName || "Anfitrión Asignado"} 🎤
              </p>
              <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                🔒 El Anfitrión ya ha configurado su usuario y PIN de 4 dígitos. El Súper Admin no puede acceder ni controlar el evento directamente para preservar la privacidad de las credenciales.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-100/60 p-3 text-center">
              <span className="text-xs font-extrabold uppercase tracking-wide text-amber-900">
                ⚠️ Ningún Anfitrión registrado actualmente
              </span>
              <p className="text-xs font-medium text-amber-800 mt-0.5">
                Genera y envía el enlace seguro a continuación para que el Anfitrión cree su PIN.
              </p>
            </div>
          )}

          {!setupLink ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mt-1">
              <button
                onClick={handleGenerateHostLink}
                disabled={generatingLink}
                className="w-full rounded-2xl bg-emerald-600 py-3 font-extrabold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {generatingLink ? "Generando…" : "🔗 Generar Enlace Seguro"}
              </button>
              <button
                onClick={handleResetAndChangeHost}
                disabled={generatingLink}
                className="w-full rounded-2xl border-2 border-rose-400 bg-rose-500 py-3 font-extrabold text-white shadow-md transition hover:bg-rose-600 disabled:opacity-50"
              >
                {generatingLink ? "Procesando…" : "🔄 Restablecer y Cambiar Anfitrión"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl border-2 border-emerald-300 bg-white p-4 text-center">
              <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-900">
                ¡Enlace seguro listo para enviar!
              </span>
              <p className="font-mono text-xs font-extrabold text-slate-800 break-all select-all">
                {setupLink}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(setupLink);
                    showToast("📋 Enlace copiado al portapapeles.");
                  }}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow transition hover:bg-emerald-700"
                >
                  📋 Copiar Enlace
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hola! 👋 Aquí tienes tu enlace seguro para crear tu usuario y PIN como Anfitrión del Baby Revela: ${setupLink}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-extrabold text-white shadow transition hover:bg-emerald-800"
                >
                  📲 Enviar por WhatsApp
                </a>
                <button
                  onClick={handleResetAndChangeHost}
                  disabled={generatingLink}
                  className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-extrabold text-rose-800 shadow-sm transition hover:bg-rose-100"
                >
                  🔄 Cambiar Anfitrión
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Módulo de Confirmación de Asistencia (RSVP) e Invitaciones */}
      <section className="rounded-3xl border-2 border-pink-200 bg-pink-50/70 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-200 pb-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl text-pink-900">
                <span>💌</span> Módulo de Invitaciones y Asistencia (RSVP)
              </h2>
              <p className="text-xs font-semibold text-pink-800/90">
                Personaliza los nombres de los papás, envía la invitación y revisa las asistencias confirmadas.
              </p>
            </div>
            <Link
              href="/invitacion"
              target="_blank"
              className="rounded-xl border border-pink-300 bg-white px-3.5 py-1.5 text-xs font-extrabold text-pink-900 shadow-sm transition hover:bg-pink-100"
            >
              📄 Abrir Carta de Invitación →
            </Link>
          </div>

          {/* Personalización Hogareña: Nombres de los Padres */}
          <form onSubmit={handleSaveParents} className="flex flex-col gap-2 rounded-2xl border border-pink-200 bg-white p-4">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>🏡</span> Personalizar Nombres de los Padres (para la carta):
            </label>
            <div className="flex gap-2">
              <input
                value={parentsNamesInput}
                onChange={(e) => setParentsNamesInput(e.target.value)}
                placeholder="Ej. María & Carlos"
                maxLength={40}
                required
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-pink-400 focus:bg-white"
              />
              <button
                type="submit"
                disabled={savingParents}
                className="rounded-xl bg-pink-600 px-4 py-2 text-xs font-extrabold text-white shadow transition hover:bg-pink-700 disabled:opacity-50"
              >
                {savingParents ? "Guardando…" : "💾 Guardar Nombres"}
              </button>
            </div>
          </form>

          {/* Schedule Validation Banner */}
          {schedule?.revealTime ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-950">
              <span className="text-base">✅</span>
              <div>
                <strong>Horario Oficial Confirmado:</strong> {schedule.eventDate ? `${schedule.eventDate} · ` : ""}{schedule.eventTime ? `Inicio Reunión: ${schedule.eventTime} · ` : ""}<strong>Revelación: {schedule.revealTime}</strong>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-950">
              <span className="text-base">⚠️</span>
              <div>
                <strong>Atención (Horario Pendiente):</strong> El anfitrión aún no ha fijado la hora de la revelación en el Panel del Anfitrión (`/admin`). Los enlaces generarán la invitación, pero se recomienda definir la hora antes de enviar.
              </div>
            </div>
          )}

          {/* Botones de Envío Rápido de Invitaciones (Presencial vs Remota) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* 1. Invitación Presencial */}
            <div className="flex flex-col gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-950">
                  🎟️ Invitación Presencial
                </span>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  Con regalos / snacks
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-amber-900 break-all select-all">
                {APP_DOMAIN}/invitacion?mode=presencial
              </span>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${APP_DOMAIN}/invitacion?mode=presencial`);
                    showToast(
                      schedule?.revealTime
                        ? "📋 Enlace presencial copiado."
                        : "⚠️ Copiado (Recuerda fijar la hora en el Panel del Anfitrión)."
                    );
                  }}
                  className="flex-1 rounded-xl border border-amber-400 bg-white py-1.5 text-xs font-extrabold text-amber-950 hover:bg-amber-100 shadow-sm"
                >
                  📋 Copiar
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `¡Hola! 💌 ${parentsNamesInput} te invitan cordialmente al Baby Shower y Revelación de Sexo en vivo! 🎉\n\n${
                      schedule?.eventDate ? `🗓️ Fecha: ${schedule.eventDate}\n` : ""
                    }${
                      schedule?.eventTime ? `🎟️ Inicio Reunión: ${schedule.eventTime}\n` : ""
                    }${
                      schedule?.revealTime ? `🔥 Gran Revelación: ${schedule.revealTime}\n` : "⏳ Hora de Revelación: Por confirmar\n"
                    }\nPor favor confirma tu asistencia presencial e ingresa tu apodo aquí: ${APP_DOMAIN}/invitacion?mode=presencial`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-center text-xs font-extrabold text-white hover:bg-emerald-700 shadow"
                >
                  📲 WhatsApp
                </a>
                <Link
                  href="/invitacion?mode=presencial"
                  target="_blank"
                  className="rounded-xl border border-amber-300 bg-amber-200 px-3 py-1.5 text-xs font-extrabold text-amber-950 hover:bg-amber-300 shadow-sm"
                >
                  👁️ Previsualizar
                </Link>
              </div>
            </div>

            {/* 2. Invitación Remota / Virtual */}
            <div className="flex flex-col gap-2 rounded-2xl border-2 border-purple-300 bg-purple-50/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-purple-950">
                  🌐 Invitación Remota / Exterior
                </span>
                <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-900">
                  100% Virtual
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-purple-900 break-all select-all">
                {APP_DOMAIN}/invitacion?mode=remota
              </span>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${APP_DOMAIN}/invitacion?mode=remota`);
                    showToast(
                      schedule?.revealTime
                        ? "📋 Enlace remoto copiado."
                        : "⚠️ Copiado (Recuerda fijar la hora en el Panel del Anfitrión)."
                    );
                  }}
                  className="flex-1 rounded-xl border border-purple-400 bg-white py-1.5 text-xs font-extrabold text-purple-950 hover:bg-purple-100 shadow-sm"
                >
                  📋 Copiar
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `¡Hola! 🌐 Aunque la distancia nos separe, ${parentsNamesInput} quieren que seas parte de la gran Revelación de Sexo en vivo desde tu celular o computadora! 👶✨\n\n${
                      schedule?.eventDate ? `🗓️ Fecha: ${schedule.eventDate}\n` : ""
                    }${
                      schedule?.revealTime ? `🔥 Hora Revelación en Vivo: ${schedule.revealTime}\n` : "⏳ Hora de Revelación: Por confirmar\n"
                    }\nPor favor confirma tu conexión remota ingresando aquí: ${APP_DOMAIN}/invitacion?mode=remota`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-purple-600 py-1.5 text-center text-xs font-extrabold text-white hover:bg-purple-700 shadow"
                >
                  📲 WhatsApp
                </a>
                <Link
                  href="/invitacion?mode=remota"
                  target="_blank"
                  className="rounded-xl border border-purple-300 bg-purple-200 px-3 py-1.5 text-xs font-extrabold text-purple-950 hover:bg-purple-300 shadow-sm"
                >
                  👁️ Previsualizar
                </Link>
              </div>
            </div>
          </div>

          {/* Capacity Full Warning Banner if 20 Presencial Limit is Reached */}
          {rsvpStats.presencialCapacityReached && (
            <div className="flex flex-col gap-2 rounded-2xl border-4 border-rose-500 bg-rose-100 p-4 text-rose-950 shadow-lg animate-pulse">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-rose-950">
                  🚨 ¡AFORO MÁXIMO PRESENCIAL ALCANZADO ({rsvpStats.presencialPeople} / {MAX_CAPACITY} PERSONAS)!
                </span>
                <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black text-white">
                  100% LLENO
                </span>
              </div>
              <p className="text-[11px] font-extrabold text-rose-900 leading-snug">
                ⚠️ <strong>Atención Súper Admin:</strong> Se ha alcanzado el aforo máximo de 20 personas en el recinto presencial. No envíes más invitaciones presenciales. Comparte únicamente la <strong>Invitación Remota / Virtual</strong>.
              </p>
            </div>
          )}

          {/* Metrics Bar with Capacity Progress */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={`flex flex-col items-center gap-0.5 rounded-2xl border p-3 text-center shadow-sm ${
              rsvpStats.presencialCapacityReached ? "border-rose-400 bg-rose-50 text-rose-950 font-black" : "border-amber-200 bg-amber-50 text-amber-950"
            }`}>
              <span className="text-[10px] font-extrabold uppercase text-amber-900">🎟️ Presencial</span>
              <span className="font-display text-xl">{rsvpStats.presencialPeople} / {MAX_CAPACITY}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-purple-200 bg-purple-50 p-3 text-center shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-purple-900">🌐 Remoto</span>
              <span className="font-display text-xl text-purple-900">{rsvpStats.remotePeople}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-pink-200 bg-white p-3 text-center shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Confirmados</span>
              <span className="font-display text-xl text-pink-900">{rsvpStats.confirmedCount}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-center shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-rose-900">No Asistirán</span>
              <span className="font-display text-xl text-rose-800">{rsvpStats.declinedCount}</span>
            </div>
          </div>

          {/* List of RSVPs */}
          {rsvps.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-pink-200 p-4 text-center text-xs font-semibold text-pink-800">
              Aún no hay confirmaciones de asistencia registradas. Comparte el enlace de la invitación para comenzar.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-pink-100 rounded-2xl border border-pink-200 bg-white">
              {rsvps.map((item) => (
                <div key={item.id} className="flex flex-col gap-1 p-3 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2 text-slate-800">
                      <span>{item.attending ? "✅ Asistirá" : "❌ No Asistirá"}</span>
                      {item.name}
                      <span className="font-normal text-slate-500">
                        ({item.guestsCount} persona/s)
                      </span>
                    </span>
                  </div>
                  {item.message && (
                    <p className="pl-6 italic text-slate-600">
                      &ldquo;{item.message}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Control Total: Restablecer Evento */}
      <section className="rounded-3xl border-2 border-purple-200 bg-purple-50/70 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-purple-900">
              <span>👑</span> Control Total del Evento
            </h2>
            <p className="text-xs font-semibold text-purple-800/80">
              Archiva los votos actuales en el historial y reinicia la app para una nueva sesión limpia.
            </p>
          </div>
          <button
            onClick={() => setConfirmResetOpen(true)}
            className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg transition hover:shadow-xl hover:opacity-95 shrink-0"
          >
            🔄 Restablecer y Archivar Evento
          </button>
        </div>
      </section>

      {/* Modal de confirmación para restablecer */}
      <AnimatePresence>
        {confirmResetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setConfirmResetOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-md flex-col gap-4 rounded-3xl border-2 border-purple-300 bg-white p-6 text-center shadow-2xl"
            >
              <span className="text-4xl">👑</span>
              <h3 className="font-display text-2xl text-purple-900">
                ¿Restablecer y Archivar Sesión?
              </h3>
              <p className="text-xs font-semibold leading-relaxed text-slate-600">
                Se guardará un registro de los resultados y votos de esta sesión en el <strong>Historial de Eventos Anteriores</strong> y se dejará la app en blanco para el próximo evento.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  disabled={isResetting}
                  onClick={() => setConfirmResetOpen(false)}
                  className="flex-1 rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  disabled={isResetting}
                  onClick={handleSuperReset}
                  className="flex-1 rounded-2xl bg-purple-600 py-3 font-bold text-white shadow transition hover:bg-purple-700 disabled:opacity-50"
                >
                  {isResetting ? "Archivando…" : "Sí, Restablecer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard en Tiempo Real */}
      <section className="rounded-3xl border-2 border-gold bg-white/80 p-5 shadow-md backdrop-blur">
        <h2 className="mb-4 font-display text-xl text-gold-dark">
          Dashboard de votaciones 📊
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total de votos"
            value={String(totals.total)}
            accent="border-baby-blue-light"
          />
          <StatCard
            label="Team Niño"
            value={`${totals.boy} · ${totals.boyPercent}%`}
            accent="border-baby-blue-light"
          />
          <StatCard
            label="Team Niña"
            value={`${totals.girl} · ${totals.girlPercent}%`}
            accent="border-baby-pink-light"
          />
          <StatCard
            label="Fase"
            value={
              appState.phase === "voting"
                ? "Votando"
                : appState.phase === "countdown"
                  ? "Cuenta atrás"
                  : appState.phase === "revealed"
                    ? "Revelado"
                    : "Espera"
            }
            accent="border-baby-pink-light"
          />
        </div>

        <div className="mt-5">
          <PercentageBar totals={totals} />
        </div>

        <div className="mt-5">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">
            Votos en el tiempo
          </h3>
          <VoteTimeline entries={log} />
        </div>

        <div className="mt-5">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">
            Últimos votos recibidos
          </h3>
          {voters.length === 0 ? (
            <p className="text-sm font-semibold text-ink-soft">
              Aún no hay votos en la sesión actual.
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-baby-blue-light overflow-y-auto rounded-2xl border-2 border-baby-blue-light bg-white/70">
              {voters.map((vote) => (
                <li
                  key={vote.updatedAt}
                  className="flex items-center justify-between px-4 py-2 text-sm font-semibold"
                >
                  <span className="flex items-center gap-2 text-ink">
                    <span>{TEAM_EMOJI[vote.team]}</span>
                    {vote.name}
                  </span>
                  <span className="text-xs text-ink-soft">
                    {TEAM_LABEL[vote.team]} · {time(vote.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Historial de Sesiones Anteriores */}
      <section className="rounded-3xl border-2 border-slate-200 bg-white/90 p-5 shadow-lg backdrop-blur">
        <h2 className="mb-1 flex items-center gap-2 font-display text-xl text-slate-800">
          <span>📜</span> Historial de Eventos Anteriores
        </h2>
        <p className="mb-4 text-xs font-semibold text-slate-500">
          Registro completo de sesiones y votaciones concluidas previamente.
        </p>

        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500">
            Aún no hay sesiones archivadas en el historial.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border-2 border-slate-100 bg-slate-50/70 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🗓️</span>
                    <span className="font-bold text-slate-800 text-sm">{item.dateStr}</span>
                  </div>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-extrabold ${
                      item.revealChoice === "boy"
                        ? "bg-sky-100 text-sky-800"
                        : item.revealChoice === "girl"
                          ? "bg-pink-100 text-pink-800"
                          : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    Resultado: {item.revealChoice === "boy" ? "Niño 👦" : item.revealChoice === "girl" ? "Niña 👧" : "Sin revelar"}
                  </span>
                </div>

                <PercentageBar totals={item.totals} />

                <details className="mt-1">
                  <summary className="cursor-pointer text-xs font-bold text-indigo-600 hover:underline">
                    Ver listado de {item.votes?.length || 0} votantes de esta sesión
                  </summary>
                  <ul className="mt-2 max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 text-xs">
                    {item.votes?.map((v, i) => (
                      <li key={i} className="flex justify-between py-1 px-2">
                        <span className="font-semibold text-slate-800">
                          {TEAM_EMOJI[v.team]} {v.name}
                        </span>
                        <span className="text-slate-400">{TEAM_LABEL[v.team]}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🧪 Módulo de Pruebas y Simulador de Revelación */}
      <section className="rounded-3xl border-2 border-purple-300 bg-purple-50/80 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl text-purple-950">
              <span>🧪</span> Módulo de Pruebas y Simulador de Revelación
            </h2>
            <span className="rounded-full bg-purple-200 px-3 py-0.5 text-xs font-black text-purple-900">
              Sin Afectar el Evento Real
            </span>
          </div>
          <p className="text-xs font-semibold text-purple-900/90 leading-relaxed">
            Prueba de forma segura la cuenta regresiva, la explosión de confetti, la revelación animada y las notificaciones para verificar que todo funcione perfecto antes del inicio.
          </p>

          <button
            type="button"
            onClick={() => setSimulatorOpen(true)}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 py-3.5 font-extrabold text-white shadow-md transition hover:shadow-xl"
          >
            🚀 Abrir Simulador de Revelación y Pruebas →
          </button>
        </div>
      </section>

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
            href="/admin"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
          >
            <span>🎤</span> Panel Anfitrión
          </Link>
        </div>
      </div>

      {/* Simulator Modal */}
      <RevelationSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
      />
    </div>
  );
}

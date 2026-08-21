"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCATION,
  addRSVPComment,
  adminReset,
  computeTotals,
  createHostSetupLink,
  createSingleUseTenantInvite,
  getHostInfo,
  likeRSVPMessage,
  resetHostCredentials,
  respondSupportMessage,
  setEventCancellation,
  setEventLocation,
  setParentsNames,
  setSuperAdminSchedule,
  subscribeEventCancellation,
  subscribeEventLocation,
  subscribeEventSchedule,
  subscribeHistory,
  subscribeMasterAnalytics,
  subscribeParentsNames,
  subscribeRSVPs,
  subscribeState,
  subscribeSupportChats,
  subscribeTenantInvites,
  subscribeVoteLog,
  subscribeVotes,
} from "@/lib/db";
import type {
  AppState,
  EventSchedule,
  HistoricalSession,
  MasterAnalytics,
  RSVP,
  SupportChatMessage,
  Team,
  TenantInvite,
  VoteLogEntry,
  VoteMap,
} from "@/lib/types";
import { APP_DOMAIN } from "@/lib/constants";
import { ConnectionPill } from "@/components/shared/ConnectionPill";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { PercentageBar } from "@/components/guest/PercentageBar";
import { VoteTimeline } from "./VoteTimeline";
import { RevelationSimulatorModal } from "./RevelationSimulatorModal";
import { LocationModal } from "@/components/guest/LocationModal";

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
  const [eventDateInput, setEventDateInput] = useState("");
  const [eventTimeInput, setEventTimeInput] = useState("");
  const [savingParents, setSavingParents] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [cancelStatus, setCancelStatus] = useState<"activo" | "aplazado" | "cancelado">("activo");
  const [cancelReason, setCancelReason] = useState("");
  const [savingCancellation, setSavingCancellation] = useState(false);

  const [setupLink, setSetupLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [hostInfo, setHostInfo] = useState<{ hostName: string | null; pinHash: string | null } | null>(null);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Location & Reference Image State
  const [addressInput, setAddressInput] = useState(DEFAULT_LOCATION.address);
  const [referenceInput, setReferenceInput] = useState(DEFAULT_LOCATION.reference);
  const [photoUrlInput, setPhotoUrlInput] = useState(DEFAULT_LOCATION.photoUrl);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationPreviewOpen, setLocationPreviewOpen] = useState(false);

  // Master Dashboard ChrizDev State
  const [masterAnalytics, setMasterAnalytics] = useState<MasterAnalytics | null>(null);
  const [singleUseInvites, setSingleUseInvites] = useState<TenantInvite[]>([]);
  const [newSingleUseLink, setNewSingleUseLink] = useState<string | null>(null);
  const [generatingSingleUseLink, setGeneratingSingleUseLink] = useState(false);

  // Support Chat & RSVP Comments State
  const [supportChats, setSupportChats] = useState<SupportChatMessage[]>([]);
  const [replyingChatId, setReplyingChatId] = useState<string | null>(null);
  const [supportResponseText, setSupportResponseText] = useState("");
  const [adminCommentRSVPId, setAdminCommentRSVPId] = useState<string | null>(null);
  const [adminCommentText, setAdminCommentText] = useState("");

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
    const offSchedule = subscribeEventSchedule((sched) => {
      setSchedule(sched);
      if (sched) {
        if (sched.eventDate) setEventDateInput(sched.eventDate);
        if (sched.eventTime) setEventTimeInput(sched.eventTime);
      }
    });
    const offCancel = subscribeEventCancellation((c) => {
      if (c) {
        setCancelStatus(c.status);
        setCancelReason(c.reason || "");
      } else {
        setCancelStatus("activo");
        setCancelReason("");
      }
    });
    const offLoc = subscribeEventLocation((loc) => {
      if (loc) {
        setAddressInput(loc.address || DEFAULT_LOCATION.address);
        setReferenceInput(loc.reference || DEFAULT_LOCATION.reference);
        setPhotoUrlInput(loc.photoUrl || DEFAULT_LOCATION.photoUrl);
      }
    });
    const offAnalytics = subscribeMasterAnalytics(setMasterAnalytics);
    const offInvites = subscribeTenantInvites(setSingleUseInvites);
    const offSupportChats = subscribeSupportChats(setSupportChats);

    return () => {
      offState();
      offVotes();
      offLog();
      offHistory();
      offRSVPs();
      offParents();
      offSchedule();
      offCancel();
      offLoc();
      offAnalytics();
      offInvites();
      offSupportChats();
    };
  }, []);

  const handleSendAdminComment = async (rsvpId: string) => {
    if (!adminCommentText.trim()) return;
    try {
      await addRSVPComment(rsvpId, adminCommentText.trim(), "Super Admin (ChrizDev)");
      setAdminCommentText("");
      setAdminCommentRSVPId(null);
      showToast("💬 Comentario del Súper Admin añadido exitosamente.");
    } catch {
      showToast("❌ Error añadiendo comentario.");
    }
  };

  const handleRespondSupportChat = async (chatId: string) => {
    if (!supportResponseText.trim()) return;
    try {
      await respondSupportMessage(chatId, supportResponseText.trim());
      setSupportResponseText("");
      setReplyingChatId(null);
      showToast("💬 Respuesta de soporte enviada en tiempo real al invitado.");
    } catch {
      showToast("❌ Error al responder chat.");
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLocation(true);
    try {
      await setEventLocation(addressInput, referenceInput, photoUrlInput);
      showToast("📍 Ubicación e imagen de referencia actualizadas exitosamente.");
    } catch {
      showToast("❌ Error actualizando ubicación.");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleGenerateSingleUseLink = async () => {
    setGeneratingSingleUseLink(true);
    try {
      const invite = await createSingleUseTenantInvite("ChrizDev");
      const url = `${window.location.origin}/setup-admin?tenantInvite=${invite.token}`;
      setNewSingleUseLink(url);
      showToast("⚡ Enlace único de 1 solo uso generado con éxito.");
    } catch {
      showToast("❌ Error al generar enlace único.");
    } finally {
      setGeneratingSingleUseLink(false);
    }
  };

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

  const handleSaveSuperSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchedule(true);
    try {
      await setSuperAdminSchedule(eventDateInput, eventTimeInput);
      showToast("✓ Fecha y Hora de Inicio Presencial guardadas.");
    } catch (err) {
      console.error(err);
      showToast("Error al guardar programación de reunión.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSaveCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCancellation(true);
    try {
      await setEventCancellation(cancelStatus, cancelReason);
      showToast(
        cancelStatus === "activo"
          ? "✓ Estado del evento restablecido a Activo."
          : `📢 Estado "${cancelStatus.toUpperCase()}" publicado para los invitados.`
      );
    } catch (err) {
      console.error(err);
      showToast("Error al cambiar estado del evento.");
    } finally {
      setSavingCancellation(false);
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

          {/* Formulario Súper Admin: Programación de Fecha y Hora de Inicio Reunión Presencial */}
          <form onSubmit={handleSaveSuperSchedule} className="flex flex-col gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                <span>🗓️</span> Fecha y Hora de Inicio Reunión Presencial (Súper Admin)
              </span>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                Súper Admin
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="superEventDate" className="text-[11px] font-bold text-amber-950">
                  🗓️ Fecha del Evento:
                </label>
                <input
                  id="superEventDate"
                  value={eventDateInput}
                  onChange={(e) => setEventDateInput(e.target.value)}
                  placeholder="Ej. Sábado, 24 de Agosto de 2026"
                  className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="superEventTime" className="text-[11px] font-bold text-amber-950">
                  🎟️ Hora Inicio Reunión Presencial:
                </label>
                <input
                  id="superEventTime"
                  value={eventTimeInput}
                  onChange={(e) => setEventTimeInput(e.target.value)}
                  placeholder="Ej. 4:00 PM"
                  className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSchedule}
              className="mt-1 rounded-xl bg-amber-600 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-amber-700 disabled:opacity-50"
            >
              {savingSchedule ? "Guardando…" : "💾 Guardar Fecha y Hora de Inicio Presencial"}
            </button>
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
            <div className="max-h-72 overflow-y-auto divide-y divide-pink-100 rounded-2xl border border-pink-200 bg-white">
              {rsvps.map((item) => (
                <div key={item.id} className="flex flex-col gap-1.5 p-3 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2 text-slate-800">
                      <span>{item.attending ? "✅ Asistirá" : "❌ No Asistirá"}</span>
                      {item.name}
                      {item.relationship && (
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-900">
                          {item.relationship}
                        </span>
                      )}
                      <span className="font-normal text-slate-500">
                        ({item.guestsCount} persona/s)
                      </span>
                    </span>
                  </div>

                  {item.message && (
                    <div className="flex items-center justify-between pl-6 text-slate-600">
                      <p className="italic">
                        &ldquo;{item.message}&rdquo;
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => likeRSVPMessage(item.id)}
                          className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-600 border border-rose-200 hover:bg-rose-100 transition"
                        >
                          ❤️ {item.likes || 0}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminCommentRSVPId(adminCommentRSVPId === item.id ? null : item.id);
                            setAdminCommentText("");
                          }}
                          className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                        >
                          💬 Comentar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render Comments Thread */}
                  {item.comments && Object.keys(item.comments).length > 0 && (
                    <div className="ml-6 mt-1 flex flex-col gap-1 rounded-xl bg-purple-50/60 p-2 border border-purple-100">
                      {Object.values(item.comments).map((comm) => (
                        <div key={comm.id} className="text-[11px]">
                          <span className="font-extrabold text-purple-900">{comm.author}: </span>
                          <span className="text-slate-700 font-medium">{comm.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Admin Comment Reply Input */}
                  {adminCommentRSVPId === item.id && (
                    <div className="ml-6 mt-1 flex items-center gap-2">
                      <input
                        value={adminCommentText}
                        onChange={(e) => setAdminCommentText(e.target.value)}
                        placeholder={`Comentar a ${item.name} como Super Admin...`}
                        className="w-full rounded-xl border border-purple-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendAdminComment(item.id)}
                        className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition shrink-0"
                      >
                        Enviar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 💬 Dudas / Chat de Soporte de Invitados (Tiempo Real) */}
      <section className="rounded-3xl border-2 border-indigo-400 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-indigo-700/60 pb-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-indigo-300">
              <span>💬</span> Chat de Soporte / Preguntas de Invitados en Tiempo Real
            </h2>
            <p className="text-xs font-semibold text-indigo-200/90">
              Mensajes enviados por invitados desde la burbuja flotante para resolver dudas de ubicación, regalos u horarios.
            </p>
          </div>
          <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-black text-indigo-300 border border-indigo-400/40">
            {supportChats.filter((c) => c.status === "pending").length} Sin Responder
          </span>
        </div>

        {supportChats.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-indigo-800 p-6 text-center text-xs font-medium text-indigo-300">
            Aún no hay preguntas registradas de los invitados. Aparecerán aquí en tiempo real cuando escriban en la burbuja flotante.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {supportChats.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 rounded-2xl border border-indigo-700/80 bg-slate-950/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-300 flex items-center gap-2">
                    <span>👤</span> {c.guestName}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                    c.status === "pending"
                      ? "bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse"
                      : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  }`}>
                    {c.status === "pending" ? "⏳ SIN RESPONDER" : "✅ RESPONDIDO"}
                  </span>
                </div>

                <p className="text-xs text-slate-100 font-semibold italic bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  &ldquo;{c.message}&rdquo;
                </p>

                {c.response ? (
                  <div className="rounded-xl bg-emerald-950/90 p-2.5 text-xs text-emerald-200 border border-emerald-700">
                    <span className="text-[10px] font-black uppercase text-emerald-400 block mb-0.5">
                      👑 Tu Respuesta (Súper Admin):
                    </span>
                    <p className="font-medium">{c.response}</p>
                  </div>
                ) : (
                  <div>
                    {replyingChatId === c.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          value={supportResponseText}
                          onChange={(e) => setSupportResponseText(e.target.value)}
                          placeholder="Escribe tu respuesta pública para el invitado..."
                          className="w-full rounded-xl border border-indigo-600 bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRespondSupportChat(c.id)}
                          className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition shrink-0"
                        >
                          Enviar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingChatId(c.id);
                          setSupportResponseText("");
                        }}
                        className="mt-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition self-start"
                      >
                        ✍️ Responder a {c.guestName}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 📹 Galería de Videos de Invitados (Para Collage / TikTok) */}
      <section className="rounded-3xl border-2 border-pink-300 bg-gradient-to-br from-pink-50 via-purple-50 to-white p-5 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between border-b border-pink-200 pb-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-pink-950">
              <span>🎬</span> Galería de Videos Saludo (Para Collage TikTok)
            </h2>
            <p className="text-xs font-semibold text-pink-900/90">
              Videos cortos enviados por los invitados (Tías, Primas, Abuelas...) indicando su predicción.
            </p>
          </div>
          <span className="rounded-full bg-pink-200 px-3 py-1 text-xs font-black text-pink-950 border border-pink-300">
            {rsvps.filter((r) => r.videoUrl).length} Videos Recibidos
          </span>
        </div>

        {rsvps.filter((r) => r.videoUrl).length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-pink-200 p-6 text-center text-xs font-semibold text-pink-800">
            Aún no se han recibido videos de los invitados. Aparecerán aquí automáticamente tan pronto como los adjunten al confirmar asistencia.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rsvps
              .filter((r) => r.videoUrl)
              .map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-2xl border-2 border-pink-200 bg-white p-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">
                      {item.name}
                    </span>
                    {item.relationship && (
                      <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-900">
                        {item.relationship}
                      </span>
                    )}
                  </div>

                  {item.prediction && (
                    <span className={`text-[10px] font-black rounded-md px-2 py-0.5 self-start ${
                      item.prediction === "boy" ? "bg-sky-100 text-sky-900" : "bg-pink-100 text-pink-900"
                    }`}>
                      🔮 Predicción: {item.prediction === "boy" ? "👦 NIÑO" : "👧 NIÑA"}
                    </span>
                  )}

                  <div className="overflow-hidden rounded-xl border border-slate-900 bg-black">
                    <video
                      src={item.videoUrl}
                      controls
                      className="max-h-56 w-full object-contain"
                    />
                  </div>

                  <a
                    href={item.videoUrl}
                    download={`video_${item.name.replace(/\s+/g, "_")}.webm`}
                    className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-pink-600 py-2 text-xs font-extrabold text-white shadow hover:bg-pink-700 transition"
                  >
                    <span>⬇️</span> Descargar Clip para Editar Collage TikTok
                  </a>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* 📍 Personalización de Ubicación e Imagen de Referencia */}
      <section className="rounded-3xl border-2 border-amber-300 bg-amber-50/70 p-5 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-amber-950">
              <span>📍</span> Personalización de Ubicación e Imagen de Referencia
            </h2>
            <p className="text-xs font-semibold text-amber-900/90">
              Personaliza la dirección exacta, notas de llegada e imagen de la entrada para cualquier evento o Baby Shower.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLocationPreviewOpen(true)}
            className="rounded-full bg-amber-200 px-3.5 py-1.5 text-xs font-black text-amber-950 border border-amber-400 shadow-sm hover:bg-amber-300 transition"
          >
            🔍 Previsualizar Modal
          </button>
        </div>

        <form onSubmit={handleSaveLocation} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-amber-950">
              🏠 Dirección Exacta del Evento:
            </label>
            <input
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Ej. Carrera 15 #9a-36. Casa 107. El Poblado"
              required
              className="w-full rounded-2xl border-2 border-amber-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-amber-950">
              🧭 Referencias e Indicaciones de Llegada:
            </label>
            <textarea
              value={referenceInput}
              onChange={(e) => setReferenceInput(e.target.value)}
              rows={3}
              placeholder="Ej. Subiendo a mano derecha encontrarás la Urbanización Zándalo. Al frente verás la portería..."
              required
              className="w-full rounded-2xl border-2 border-amber-200 bg-white p-3 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-amber-950">
              📸 URL de Imagen de Referencia (Entrada / Fachada / Lugar):
            </label>
            <input
              value={photoUrlInput}
              onChange={(e) => setPhotoUrlInput(e.target.value)}
              placeholder="Ej. /imagen_entrada.jpeg o URL https://..."
              required
              className="w-full rounded-2xl border-2 border-amber-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingLocation}
            className="w-full rounded-2xl bg-amber-600 py-3 text-xs font-extrabold text-white shadow hover:bg-amber-700 transition disabled:opacity-50"
          >
            {savingLocation ? "Guardando ubicación..." : "💾 Guardar Ubicación e Imagen Personalizada"}
          </button>
        </form>
      </section>

      {/* 👑 Master Dashboard ChrizDev (Analytics Multi-Tenant & Enlaces de 1 Solo Uso) */}
      <section className="rounded-3xl border-2 border-sky-400 bg-gradient-to-br from-sky-900 via-slate-900 to-indigo-950 p-5 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-sky-800/60 pb-3 gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl text-sky-300">
              <span>👑</span> Master Dashboard ChrizDev (Global Multi-Tenant)
            </h2>
            <p className="text-xs font-semibold text-sky-200/90">
              Monitorización en tiempo real de eventos activos, analíticas globales y generación de enlaces de 1 solo uso para nuevos administradores.
            </p>
          </div>
          <span className="rounded-full bg-sky-500/20 px-3.5 py-1 text-xs font-black text-sky-300 border border-sky-400/40 backdrop-blur">
            ChrizDev (Christian Romero)
          </span>
        </div>

        {/* Realtime Metrics Cards */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-sky-800/80 bg-sky-950/60 p-3 text-center">
            <span className="text-[10px] font-bold uppercase text-sky-300">Eventos Activos</span>
            <span className="font-display text-2xl font-black text-white">{masterAnalytics?.totalEvents || 1}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-800/80 bg-emerald-950/60 p-3 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-300">Confirmaciones RSVPs</span>
            <span className="font-display text-2xl font-black text-white">{masterAnalytics?.totalRSVPs || rsvps.length}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-purple-800/80 bg-purple-950/60 p-3 text-center">
            <span className="text-[10px] font-bold uppercase text-purple-300">Votos Totales</span>
            <span className="font-display text-2xl font-black text-white">{masterAnalytics?.totalVotes || totals.total}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-800/80 bg-amber-950/60 p-3 text-center">
            <span className="text-[10px] font-bold uppercase text-amber-300">Enlaces 1-Solo-Uso</span>
            <span className="font-display text-2xl font-black text-white">{singleUseInvites.length}</span>
          </div>
        </div>

        {/* Generator for Single-Use Tenant Invite Links */}
        <div className="mt-5 rounded-2xl border border-sky-700/60 bg-sky-950/80 p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-sky-200 flex items-center gap-1.5">
                <span>⚡</span> Generar Enlace Único Autorizado (1 Solo Uso)
              </h3>
              <p className="text-[11px] font-semibold text-slate-300">
                Permite a un nuevo usuario crear su evento privado. El enlace caduca automáticamente tras su primer uso.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateSingleUseLink}
              disabled={generatingSingleUseLink}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-xs font-black text-white shadow hover:from-sky-600 hover:to-blue-700 transition disabled:opacity-50"
            >
              {generatingSingleUseLink ? "Generando..." : "⚡ Generar Nuevo Enlace 1-Solo-Uso"}
            </button>
          </div>

          {newSingleUseLink && (
            <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/70 p-3">
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                <span>✅</span> ¡Enlace Único Creado! Comparte este enlace con el nuevo administrador:
              </span>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={newSingleUseLink}
                  className="w-full rounded-lg border border-emerald-700 bg-slate-900 px-3 py-2 text-xs font-mono text-emerald-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newSingleUseLink);
                    showToast("📋 Enlace de 1 solo uso copiado al portapapeles.");
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shrink-0"
                >
                  📋 Copiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List of Generated Single Use Invites */}
        <div className="mt-4 flex flex-col gap-2">
          <span className="text-xs font-bold text-sky-200">
            📋 Historial de Enlaces de Autorización Generados:
          </span>
          {singleUseInvites.length === 0 ? (
            <p className="rounded-xl border border-dashed border-sky-800 p-3 text-center text-xs font-medium text-slate-400">
              Aún no se han generado enlaces únicos de autorización.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto divide-y divide-sky-900 rounded-xl border border-sky-800/80 bg-slate-950/90 text-xs">
              {singleUseInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-2.5">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-sky-300">{inv.token}</span>
                    <span className="text-[10px] text-slate-400">
                      Creado: {new Date(inv.createdAt).toLocaleString("es")}
                    </span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                    inv.used
                      ? "bg-rose-950/80 text-rose-300 border-rose-800"
                      : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  }`}>
                    {inv.used ? "🔴 USADO (Inhabilitado)" : "🟢 ACTIVO (Disponible)"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Control Total: Restablecer Evento */}
      <section className="rounded-3xl border-2 border-purple-200 bg-purple-50/70 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl text-purple-900">
              <span>👑</span> Control Total del Evento
            </h2>
            <p className="text-xs font-semibold text-purple-800/80">
              Archiva los votos actuales en el historial y reinicia la app para una nueva sesión limpia.
            </p>
          </div>

          {/* Módulo de Cancelación o Aplazamiento de Evento */}
          <form onSubmit={handleSaveCancellation} className="flex flex-col gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-rose-950 flex items-center gap-1.5">
                <span>📢</span> Anuncio / Cancelación / Aplazamiento de Evento
              </span>
              <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                Notificación a Invitados
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-rose-950">
                  Estado del Evento:
                </label>
                <select
                  value={cancelStatus}
                  onChange={(e) => setCancelStatus(e.target.value as "activo" | "aplazado" | "cancelado")}
                  className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500"
                >
                  <option value="activo">🟢 Normal / Activo (Sin cambios)</option>
                  <option value="aplazado">⏳ Aplazado (Postergado)</option>
                  <option value="cancelado">🚫 Cancelado</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-rose-950">
                  Motivo / Mensaje para los Invitados:
                </label>
                <input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ej. Tuvimos un inconveniente climático y aplazamos el evento para el próximo fin de semana"
                  className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingCancellation}
              className="mt-1 rounded-xl bg-rose-600 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-rose-700 disabled:opacity-50"
            >
              {savingCancellation ? "Publicando…" : "📢 Informar Estado a Todos los Invitados"}
            </button>
          </form>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-4">
            <div>
              <span className="text-xs font-black uppercase text-rose-950">
                ⚠️ Restablecimiento Total de Evento e Invitados
              </span>
              <p className="text-[11px] font-semibold text-rose-900/90">
                Borra la lista completa de invitados, votos, mensajes y reinicia la plataforma a cero.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 px-5 py-3 text-xs font-black text-white shadow-lg transition hover:shadow-xl hover:opacity-95 shrink-0"
            >
              🔄 Restablecer Todo y Borrar Invitados
            </button>
          </div>
        </div>
      </section>

      {/* Modal de confirmación para restablecer */}
      <AnimatePresence>
        {confirmResetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
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
                <p>• 📊 <strong>El estado actual y mensajes de anuncios.</strong></p>
                <p className="pt-1 text-slate-700">La aplicación volverá a quedar 100% limpia para empezar de cero.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  disabled={isResetting}
                  onClick={() => setConfirmResetOpen(false)}
                  className="flex-1 rounded-2xl bg-slate-100 py-3 text-xs font-extrabold text-slate-700 transition hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  disabled={isResetting}
                  onClick={handleSuperReset}
                  className="flex-1 rounded-2xl bg-rose-600 py-3 text-xs font-black text-white shadow transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {isResetting ? "Borrando todo…" : "🔥 Sí, Restablecer Todo y Borrar Invitados"}
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

      {/* Location Modal Preview */}
      <LocationModal
        isOpen={locationPreviewOpen}
        onClose={() => setLocationPreviewOpen(false)}
      />
    </div>
  );
}

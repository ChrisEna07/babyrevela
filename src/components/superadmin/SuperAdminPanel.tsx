"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  adminReset,
  computeTotals,
  subscribeHistory,
  subscribeState,
  subscribeVoteLog,
  subscribeVotes,
} from "@/lib/db";
import type {
  AppState,
  HistoricalSession,
  Team,
  VoteLogEntry,
  VoteMap,
} from "@/lib/types";
import { ConnectionPill } from "@/components/shared/ConnectionPill";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { PercentageBar } from "@/components/guest/PercentageBar";
import { VoteTimeline } from "./VoteTimeline";

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

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const offState = subscribeState(setAppState);
    const offVotes = subscribeVotes(setVotes);
    const offLog = subscribeVoteLog(setLog);
    const offHistory = subscribeHistory(setHistory);
    return () => {
      offState();
      offVotes();
      offLog();
      offHistory();
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
    </div>
  );
}

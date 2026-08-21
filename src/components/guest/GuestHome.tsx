"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { castVote, computeTotals, likeRSVPMessage, submitRSVP, subscribeRSVPs, subscribeState, subscribeVotes, updateRSVP } from "@/lib/db";
import type { AppState, RSVP, StoredGuest, Team, VoteMap } from "@/lib/types";
import { EVENT_NAME, GUEST_KEY } from "@/lib/constants";
import { createClientStore } from "@/lib/storage";
import { NameEntry } from "./NameEntry";
import { VotePanel } from "./VotePanel";
import { PercentageBar } from "./PercentageBar";
import { Countdown } from "./Countdown";
import { RevealScreen } from "./RevealScreen";
import { BabyThoughts } from "./BabyThoughts";
import { ConnectionPill } from "@/components/shared/ConnectionPill";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { LocationModal } from "./LocationModal";
import { EventCancellationBanner } from "@/components/shared/EventCancellationBanner";
import { SupportChatWidget } from "@/components/shared/SupportChatWidget";
import { fireVoteConfetti } from "@/lib/confetti";
import { VideoRecorderModal } from "./VideoRecorderModal";

const guestStore = createClientStore<StoredGuest>(GUEST_KEY);

function ForceVoteModal({
  guestName,
  onVote,
}: {
  guestName: string;
  onVote: (team: Team) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border-4 border-pink-400 bg-white p-6 text-center shadow-2xl"
      >
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg bg-pink-50">
          <img
            src="/gift/Powder Explodes All Over Wife At Gender Reveal GIF by ViralHog.gif"
            alt="Gender Reveal GIF"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="rounded-full bg-pink-100 px-3 py-1 text-[11px] font-black uppercase text-pink-900 shadow-sm animate-pulse">
            🚨 Votación Obligatoria
          </span>
          <h2 className="font-display text-2xl text-slate-900 mt-1">
            ¡Hola, {guestName}! 👋
          </h2>
          <h3 className="font-display text-lg text-pink-950">
            ¿Qué crees que será el bebé?
          </h3>
        </div>

        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
          Para ver toda la experiencia en vivo del baby shower y participar, <strong>debes elegir tu equipo preferido ahora mismo</strong>:
        </p>

        <div className="grid w-full grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              fireVoteConfetti("boy");
              onVote("boy");
            }}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-4 border-sky-400 bg-gradient-to-b from-sky-400 to-sky-600 p-4 text-white shadow-xl transition hover:scale-105 active:scale-95"
          >
            <span className="text-4xl">👦</span>
            <span className="font-display text-lg font-bold">Team NIÑO</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">
              Votar Niño 👦
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              fireVoteConfetti("girl");
              onVote("girl");
            }}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-4 border-pink-400 bg-gradient-to-b from-pink-400 to-pink-600 p-4 text-white shadow-xl transition hover:scale-105 active:scale-95"
          >
            <span className="text-4xl">👧</span>
            <span className="font-display text-lg font-bold">Team NIÑA</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">
              Votar Niña 👧
            </span>
          </button>
        </div>

        <p className="text-[11px] font-bold text-slate-400 italic">
          (Podrás cambiar tu voto más adelante si lo deseas)
        </p>
      </motion.div>
    </div>
  );
}

function WaitingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col items-center gap-6 text-center"
    >
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl bg-amber-50">
        <img
          src="/gift/Season 6 Finale GIF by Bachelor in Paradise.gif"
          alt="Waiting Party GIF"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex gap-3 text-3xl">
        <span className="animate-float-slow inline-block">💙</span>
        <span className="inline-block" style={{ animation: "float-slow 5s ease-in-out infinite reverse" }}>
          💗
        </span>
      </div>
      <h2 className="font-display text-3xl text-ink">Esperando al anfitrión…</h2>
      <p className="max-w-sm text-sm font-semibold text-ink-soft">
        Mientras abren las votaciones, ¡mira lo que piensa el bebé acá adentro! 👇
      </p>
      
      {/* Dynamic Baby Thoughts Speech Bubble */}
      <BabyThoughts />
    </motion.div>
  );
}

export function GuestHome() {
  const guest = useSyncExternalStore(
    guestStore.subscribe,
    guestStore.read,
    guestStore.getServerSnapshot
  );
  const [appState, setAppState] = useState<AppState | null>(null);
  const [votes, setVotes] = useState<VoteMap>({});
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [showingLanding, setShowingLanding] = useState(false);
  const [showStatsOnly, setShowStatsOnly] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  useEffect(() => {
    const offState = subscribeState(setAppState);
    const offVotes = subscribeVotes(setVotes);
    const offRsvps = subscribeRSVPs(setRsvps);
    return () => {
      offState();
      offVotes();
      offRsvps();
    };
  }, []);

  useEffect(() => {
    if (!guest && rsvps.length > 0 && typeof window !== "undefined") {
      const myRsvpId = localStorage.getItem("my_baby_rsvp_id");
      if (myRsvpId) {
        const found = rsvps.find((r) => r.id === myRsvpId);
        if (found) {
          guestStore.set({ id: found.id, name: found.name });
        }
      }
    }
  }, [guest, rsvps]);

  const [localRevealKey, setLocalRevealKey] = useState<string | null>(null);
  const totals = useMemo(() => computeTotals(votes), [votes]);
  const myVote = guest ? votes[guest.id] : undefined;

  const videoRSVPs = useMemo(() => rsvps.filter((r) => r.videoUrl), [rsvps]);

  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const myRSVP = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const rsvpId = localStorage.getItem("my_baby_rsvp_id");
    return rsvpId ? rsvps.find((r) => r.id === rsvpId) : undefined;
  }, [rsvps]);

  const handleSaveVideoFromGuestHome = async (videoUrl: string) => {
    if (myRSVP) {
      await updateRSVP(myRSVP.id, { videoUrl });
    } else if (guest) {
      const created = await submitRSVP(guest.name, true, 1, "", "presencial", "Familiar", undefined, videoUrl);
      if (typeof window !== "undefined") {
        localStorage.setItem("my_baby_rsvp_id", created.id);
      }
    }
  };

  if (!guest || showingLanding) {
    return (
      <NameEntry
        activeGuestName={guest?.name}
        onGoToApp={() => setShowingLanding(false)}
        onDone={(name) => {
          const newGuest: StoredGuest = { id: crypto.randomUUID(), name };
          guestStore.set(newGuest);
          setShowingLanding(false);
        }}
      />
    );
  }

  const phase = appState?.phase ?? "idle";
  const countdownKey = phase === "countdown" ? `${appState?.countdownEndsAt}` : null;
  const isCountdownDone = Boolean(countdownKey && localRevealKey === countdownKey);
  const showReveal = phase === "revealed" || (phase === "countdown" && isCountdownDone && Boolean(appState?.revealChoice));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-10">
      {/* Event Cancellation / Postponement Banner */}
      <EventCancellationBanner />

      {/* Location Modal */}
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />

      {/* Video Recorder Modal */}
      <VideoRecorderModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        existingVideoUrl={myRSVP?.videoUrl}
        onSaveVideo={handleSaveVideoFromGuestHome}
      />

      {/* Invasive Mandatory Voting Modal if guest hasn't voted yet during voting phase */}
      {guest && !myVote && appState !== null && (phase === "voting" || appState.votingOpen) && (
        <ForceVoteModal
          guestName={guest.name}
          onVote={(team: Team) => void castVote(guest.id, guest.name, team)}
        />
      )}

      <header className="flex w-full items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-gold-dark">{EVENT_NAME}</h1>
          <p className="text-sm font-semibold text-ink-soft">
            Hola, <span className="text-ink">{guest.name}</span> 👋
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => setLocationModalOpen(true)}
            className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-950 shadow-sm transition hover:bg-amber-100 flex items-center gap-1"
          >
            <span>📍</span> Ubicarme
          </button>
          <button
            onClick={() => setShowingLanding(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            🏠 Landing Page
          </button>
          <ConnectionPill />
          <button
            onClick={() => guestStore.set(null)}
            className="text-xs font-semibold text-ink-soft underline decoration-dotted underline-offset-2 hover:text-ink"
          >
            Cambiar nombre
          </button>
        </div>
      </header>

      {/* 🎬 Video Saludo Banner CTA */}
      <section className="w-full rounded-3xl border-2 border-pink-300 bg-gradient-to-br from-pink-50 via-purple-50 to-white p-5 shadow-lg text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl animate-bounce">🎬</span>
            <h3 className="font-display text-lg text-pink-950">
              ¡Déjanos tu Video Saludo para el Collage de TikTok!
            </h3>
          </div>
          <p className="max-w-md text-xs font-semibold text-slate-600 leading-relaxed">
            Graba con tu cámara o adjunta un clip corto de tu galería (10-30 seg) diciendo quién eres y tu felicitación para el recuerdo.
          </p>
          <button
            type="button"
            onClick={() => setVideoModalOpen(true)}
            className="rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 px-6 py-3 text-xs font-black text-white shadow-md transition hover:scale-105 flex items-center gap-2"
          >
            <span>📹</span>
            {myRSVP?.videoUrl ? "✅ ¡Video Adjuntado! (Ver o cambiar)" : "Grabar o Adjuntar Mi Video Saludo"}
          </button>
        </div>
      </section>

      {appState === null && <FullPageLoader label="Sincronizando…" />}

      {appState !== null && !showReveal && phase === "voting" && (
        <>
          <VotePanel
            myVote={myVote}
            totals={totals}
            onVote={(team: Team) => void castVote(guest.id, guest.name, team)}
          />
          <PercentageBar totals={totals} />
          <BabyThoughts compact />
        </>
      )}

      {appState !== null && !showReveal && phase === "countdown" && (
        <>
          <Countdown
            endsAt={appState.countdownEndsAt}
            onComplete={() => setLocalRevealKey(countdownKey)}
          />
          <PercentageBar totals={totals} />
        </>
      )}

      {appState !== null && showReveal && (
        <>
          {showStatsOnly ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex w-full flex-col gap-6 rounded-3xl border-2 border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur text-center"
            >
              <h2 className="font-display text-3xl text-gold-dark">
                Resultados Finales de Votación 📊
              </h2>
              <PercentageBar totals={totals} />
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => setShowStatsOnly(false)}
                  className="rounded-2xl bg-gradient-to-r from-pink-500 to-sky-500 px-6 py-3 text-sm font-extrabold text-white shadow transition hover:opacity-90"
                >
                  🎉 Ver Tarjeta de Revelación
                </button>
                <button
                  onClick={() => setShowingLanding(true)}
                  className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  🏠 Volver a Inicio
                </button>
              </div>
            </motion.div>
          ) : (
            <RevealScreen
              team={appState.revealChoice ?? "boy"}
              myTeam={myVote?.team}
              guestName={guest.name}
              onHomeClick={() => setShowingLanding(true)}
              onToggleStats={() => setShowStatsOnly(true)}
            />
          )}
        </>
      )}

      {appState !== null && !showReveal && phase === "idle" && <WaitingScreen />}

      {/* 💌 Muro de Felicitaciones y Deseos en Landing */}
      {rsvps.filter((r) => r.message).length > 0 && (
        <section className="w-full rounded-3xl border-2 border-purple-200 bg-white/90 p-5 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <h3 className="font-display text-lg text-purple-950 flex items-center gap-2">
              <span>💌</span> Muro de Felicitaciones y Deseos
            </h3>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-900">
              {rsvps.filter((r) => r.message).length} Mensajes
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
            {rsvps
              .filter((r) => r.message)
              .map((item) => {
                const commentsList = item.comments ? Object.values(item.comments) : [];
                return (
                  <div key={item.id} className="flex flex-col gap-1.5 rounded-2xl border border-purple-100 bg-purple-50/50 p-3.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{item.attending ? "✅" : "❌"}</span>
                        {item.name}
                        {item.relationship && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900">
                            {item.relationship}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => likeRSVPMessage(item.id)}
                        className="flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-black text-rose-600 border border-rose-200 shadow-sm transition hover:bg-rose-50"
                      >
                        ❤️ {item.likes || 0}
                      </button>
                    </div>

                    <p className="text-xs font-medium text-slate-700 italic">
                      &quot;{item.message}&quot;
                    </p>

                    {/* Comments Thread (Respuestas de los Padres / Anfitriones) */}
                    {commentsList.length > 0 && (
                      <div className="mt-1 flex flex-col gap-1 pl-2.5 border-l-2 border-purple-400">
                        {commentsList.map((c) => {
                          const cleanAuthor = c.author
                            .replace(/Super Admin \([^)]+\)/g, "Mamá & Papá (Anfitriones)")
                            .replace(/Super Admin/g, "Anfitrión");
                          return (
                            <div key={c.id} className="text-[11px] leading-relaxed">
                              <strong className="font-extrabold text-purple-950">{cleanAuthor}:</strong>{" "}
                              <span className="text-slate-700 font-normal">&ldquo;{c.text}&rdquo;</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* 🎬 Video Saludos de la Familia y Amigos en Landing */}
      {videoRSVPs.length > 0 && (
        <section className="w-full rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-purple-50 to-white p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-pink-200 pb-3">
            <h3 className="font-display text-lg text-pink-950 flex items-center gap-2">
              <span>🎬</span> Video Saludos y Predicciones de la Familia
            </h3>
            <span className="rounded-full bg-pink-200 px-3 py-1 text-xs font-black text-pink-950">
              {videoRSVPs.length} Videos
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videoRSVPs.map((v) => (
              <div key={v.id} className="flex flex-col gap-2 rounded-2xl border border-pink-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{v.name}</span>
                  {v.relationship && (
                    <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-900">
                      {v.relationship}
                    </span>
                  )}
                </div>

                {v.prediction && (
                  <span className={`text-[10px] font-black rounded px-2 py-0.5 self-start ${
                    v.prediction === "boy" ? "bg-sky-100 text-sky-900" : "bg-pink-100 text-pink-900"
                  }`}>
                    🔮 Dice que será: {v.prediction === "boy" ? "👦 NIÑO" : "👧 NIÑA"}
                  </span>
                )}

                <div className="overflow-hidden rounded-xl border border-slate-900 bg-black">
                  <video src={v.videoUrl} controls className="max-h-48 w-full object-contain" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floating Support Chat Widget */}
      <SupportChatWidget />
    </div>
  );
}

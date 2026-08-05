"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { castVote, computeTotals, subscribeState, subscribeVotes } from "@/lib/db";
import type { AppState, StoredGuest, Team, VoteMap } from "@/lib/types";
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

const guestStore = createClientStore<StoredGuest>(GUEST_KEY);

function WaitingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col items-center gap-6 text-center"
    >
      <div className="flex gap-3 text-5xl">
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
  const [showingLanding, setShowingLanding] = useState(false);
  const [showStatsOnly, setShowStatsOnly] = useState(false);

  useEffect(() => {
    const offState = subscribeState(setAppState);
    const offVotes = subscribeVotes(setVotes);
    return () => {
      offState();
      offVotes();
    };
  }, []);

  const [localRevealKey, setLocalRevealKey] = useState<string | null>(null);
  const totals = useMemo(() => computeTotals(votes), [votes]);
  const myVote = guest ? votes[guest.id] : undefined;

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
      <header className="flex w-full items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-gold-dark">{EVENT_NAME}</h1>
          <p className="text-sm font-semibold text-ink-soft">
            Hola, <span className="text-ink">{guest.name}</span> 👋
          </p>
        </div>
        <div className="flex items-center gap-2">
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
    </div>
  );
}

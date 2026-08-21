"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import type { Team } from "@/lib/types";

export function RevelationSimulatorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [testPhase, setTestPhase] = useState<"idle" | "countdown" | "revealed">("idle");
  const [testTeam, setTestTeam] = useState<Team>("boy");
  const [counter, setCounter] = useState(10);
  const [notifPermission, setNotifPermission] = useState<string>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [notifTested, setNotifTested] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drumRef = useRef<HTMLAudioElement | null>(null);

  const requestAndTestNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Este navegador no soporta notificaciones de escritorio.");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        new Notification("🔔 Prueba de Notificación - Baby Revela", {
          body: "¡Funciona perfectamente! Los invitados a distancia recibirán esta alerta incluso si su navegador está minimizado.",
          icon: "/icon-192.png",
          tag: "test-notification",
        });
        setNotifTested(true);
      } else {
        alert("Permiso de notificaciones denegado. Para activarlo, ajusta los permisos de tu navegador.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startTestCountdown = (team: Team) => {
    setTestTeam(team);
    setCounter(10);
    setTestPhase("countdown");

    // Start redoble audio loop
    try {
      if (drumRef.current) {
        drumRef.current.pause();
      }
      const drum = new Audio("/songreveal/redoble.mp3");
      drum.loop = true;
      drum.play().catch((err) => console.log("Drum audio blocked:", err));
      drumRef.current = drum;
    } catch (e) {
      console.error("Error playing redoble:", e);
    }
  };

  useEffect(() => {
    if (testPhase !== "countdown") return;

    if (counter === 0) {
      // Stop drum audio immediately when countdown completes
      if (drumRef.current) {
        drumRef.current.pause();
        drumRef.current.currentTime = 0;
      }

      const timer = setTimeout(() => {
        setTestPhase("revealed");
        const colorHex = testTeam === "boy" ? ["#a6d8f0", "#6fb3dd", "#ffffff"] : ["#ffd1e0", "#f5a3c3", "#ffffff"];
        confetti({
          particleCount: 140,
          spread: 100,
          origin: { y: 0.6 },
          colors: colorHex,
        });

        // Play reveal song
        try {
          const songUrl = testTeam === "boy" ? "/songreveal/Boysound.mp3" : "/songreveal/Grilsound.mp3";
          if (audioRef.current) {
            audioRef.current.pause();
          }
          const audio = new Audio(songUrl);
          audio.volume = 0.95;
          audioRef.current = audio;
          audio.play().catch((err) => console.log("Audio test autoplay blocked:", err));
        } catch (err) {
          console.error(err);
        }

        // Send test background notification
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(testTeam === "boy" ? "¡ES UN NIÑO! 👦💙" : "¡ES UNA NIÑA! 👧💗", {
              body: "¡Demostración de Notificación de Revelación en Vivo!",
              icon: testTeam === "boy" ? "/gift/Its A Boy Baby GIF by Steve Harvey TV.gif" : "/gift/Girl Pink GIF by Shay Mitchell.gif",
              tag: "test-reveal-notification",
            });
          } catch (e) {
            console.error(e);
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    const interval = setTimeout(() => {
      setCounter((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(interval);
  }, [testPhase, counter, testTeam]);

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (drumRef.current) {
      drumRef.current.pause();
      drumRef.current.currentTime = 0;
    }
    setTestPhase("idle");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative flex w-full max-w-lg flex-col items-center gap-6 rounded-[2.5rem] border-4 border-white bg-white p-6 shadow-2xl text-center sm:p-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition font-bold"
          >
            ✕
          </button>

          <span className="rounded-full bg-purple-100 px-4 py-1 text-xs font-black uppercase text-purple-900">
            🧪 Simulador de Prueba de Revelación y Audio
          </span>

          {testPhase === "idle" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <h2 className="font-display text-2xl text-slate-800">
                Prueba de Canción, Animaciones y Conteo
              </h2>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                Prueba la experiencia exacta con música de celebración (Boysound.mp3 / Grilsound.mp3), cuenta regresiva y notificaciones sin afectar el evento real.
              </p>

              {/* Push Notification Tester */}
              <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-purple-200 bg-purple-50/80 p-4 w-full text-xs">
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-purple-950 flex items-center gap-1.5">
                    <span>🔔</span> Notificaciones de Navegador:
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      notifPermission === "granted"
                        ? "bg-emerald-200 text-emerald-900"
                        : "bg-amber-200 text-amber-900"
                    }`}
                  >
                    {notifPermission === "granted" ? "Permitidas ✓" : "Pendientes"}
                  </span>
                </div>
                <p className="text-[11px] text-purple-900/90 text-left leading-relaxed">
                  Verifica que los invitados a distancia reciban la alerta sonora e ícono de revelación incluso si tienen la pestaña en segundo plano.
                </p>
                <button
                  type="button"
                  onClick={requestAndTestNotification}
                  className="w-full rounded-xl bg-purple-600 py-2.5 font-extrabold text-white shadow-sm transition hover:bg-purple-700 mt-1"
                >
                  {notifTested
                    ? "✓ Notificación Enviada al Sistema"
                    : "🔔 Probar Notificación del Navegador"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <button
                  onClick={() => startTestCountdown("boy")}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-sky-300 bg-sky-50 p-4 font-extrabold text-sky-950 shadow-sm transition hover:bg-sky-100"
                >
                  <span className="text-4xl">👦</span>
                  <span>Probar NIÑO + Boysound.mp3</span>
                </button>

                <button
                  onClick={() => startTestCountdown("girl")}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-pink-300 bg-pink-50 p-4 font-extrabold text-pink-950 shadow-sm transition hover:bg-pink-100"
                >
                  <span className="text-4xl">👧</span>
                  <span>Probar NIÑA + Grilsound.mp3</span>
                </button>
              </div>
            </div>
          )}

          {testPhase === "countdown" && (
            <div className="flex flex-col items-center gap-4 my-6">
              <span className="text-sm font-extrabold text-slate-500 uppercase tracking-widest animate-pulse">
                ⏱️ Prueba de Cuenta Regresiva
              </span>
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-gold bg-amber-50 shadow-2xl">
                <span className="font-display text-6xl text-gold-dark animate-scale">
                  {counter}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500">
                Preparando música y explosión de color para Team {testTeam === "boy" ? "Niño 👦" : "Niña 👧"}...
              </p>
            </div>
          )}

          {testPhase === "revealed" && (
            <div className="flex flex-col items-center gap-4 my-2 w-full">
              <div className="relative h-44 w-44 overflow-hidden rounded-full border-4 border-white shadow-2xl">
                <img
                  src={
                    testTeam === "boy"
                      ? "/gift/Its A Boy Baby GIF by Steve Harvey TV.gif"
                      : "/gift/Girl Pink GIF by Shay Mitchell.gif"
                  }
                  alt="Test Reveal GIF"
                  className="h-full w-full object-cover"
                />
              </div>

              <h2 className="font-display text-4xl text-gold-dark">
                {testTeam === "boy" ? "¡Es un NIÑO! 👦" : "¡Es una NIÑA! 👧"}
              </h2>

              <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-xs font-extrabold text-emerald-900 border border-emerald-300">
                <span>🎵 Reproduciendo:</span>
                <span>{testTeam === "boy" ? "Boysound.mp3" : "Grilsound.mp3"}</span>
              </div>

              <p className="text-xs font-semibold text-slate-600">
                ¡Música, animación y confetti probados exitosamente!
              </p>

              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setTestPhase("idle");
                }}
                className="mt-2 rounded-2xl bg-purple-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg transition hover:bg-purple-700"
              >
                🔄 Realizar Otra Prueba
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

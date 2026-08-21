"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { submitRSVP, subscribeParentsNames } from "@/lib/db";
import { EVENT_NAME, EVENT_TAGLINE } from "@/lib/constants";

export function InvitationCard() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "remota" ? "remota" : "presencial";
  const [mode, setMode] = useState<"presencial" | "remota">(initialMode);

  const [parentsNames, setParentsNamesState] = useState<string>("Mamá & Papá");
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean>(true);
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [soundTested, setSoundTested] = useState(false);
  const [notifTested, setNotifTested] = useState(false);
  const [nequiCopied, setNequiCopied] = useState(false);
  const [fullScreenImageOpen, setFullScreenImageOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeParentsNames(setParentsNamesState);
    return () => unsub();
  }, []);

  const valid = name.trim().length >= 2;

  const playTestChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      setSoundTested(true);
    } catch {
      setSoundTested(true);
    }
  };

  const requestNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Este navegador no soporta notificaciones.");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("🔔 Notificaciones Activadas - Baby Revela", {
          body: "¡Listo! Te avisaremos con sonido cuando el anfitrión inicie la revelación de sexo en vivo.",
          icon: "/icon-192.png",
          tag: "guest-test-notification",
        });
        setNotifTested(true);
      } else {
        alert("Permiso de notificaciones no otorgado.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      await submitRSVP(name, attending, mode === "remota" ? 1 : guestsCount, message, mode);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error al enviar tu confirmación. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-10">
      {/* Mode Selector Header */}
      <div className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white bg-white/80 p-1.5 shadow-md backdrop-blur">
        <button
          type="button"
          onClick={() => setMode("presencial")}
          className={`flex-1 rounded-full py-2 text-xs font-black transition ${
            mode === "presencial"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          🎟️ Invitación Presencial
        </button>
        <button
          type="button"
          onClick={() => setMode("remota")}
          className={`flex-1 rounded-full py-2 text-xs font-black transition ${
            mode === "remota"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          🌐 Asistencia Remota / Virtual
        </button>
      </div>

      {/* Invitation Header */}
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg bg-pink-50">
            <img
              src="/gift/Canadian Baby GIF by Shay Mitchell.gif"
              alt="Baby Shower Invitation GIF"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center justify-center gap-3 text-3xl">
            <span className="animate-float-slow inline-block">💌</span>
            <span className="animate-pulse-gold inline-block text-2xl">✨</span>
            <span className="inline-block" style={{ animation: "float-slow 5s ease-in-out infinite reverse" }}>
              👶
            </span>
          </div>
        </div>

        <span className="rounded-full bg-pink-100 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-pink-800 shadow-sm">
          {mode === "remota"
            ? "🌐 Invitación Especial para Asistencia Remota / Internacional"
            : "🎟️ Invitación Oficial Presencial al Baby Shower"}
        </span>

        <h1 className="font-display text-4xl text-gold-dark sm:text-5xl">
          {EVENT_NAME}
        </h1>
        <p className="max-w-md text-base font-semibold text-slate-600">
          {EVENT_TAGLINE} · Acompáñanos a descubrir la gran sorpresa
        </p>
      </motion.div>

      {/* Main Invitation Card Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex w-full flex-col gap-6 rounded-[2.5rem] border-4 border-white bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8"
      >
        <div className="flex flex-col items-center gap-3 border-b border-slate-100 pb-5 text-center">
          <span className="rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-900 border border-amber-200">
            🍼 Invita: {parentsNames}
          </span>
          <p className="font-display text-2xl text-slate-800">
            {mode === "remota"
              ? "¡Conéctate en vivo desde donde estés! 🌐"
              : "¡Nos encantaría contar con tu presencia! 🎉"}
          </p>
          <p className="text-sm font-semibold leading-relaxed text-slate-600">
            {mode === "remota"
              ? `${parentsNames} quieren que la distancia no sea un impedimento. Aunque estés en otra ciudad o país, serás parte de este momento único votando e interactuando en vivo a través de la aplicación.`
              : `${parentsNames} están muy felices de celebrar la llegada de su bebé junto a las personas más especiales. Ven a compartir risas, emoción y el inolvidable momento de la revelación de sexo.`}
          </p>
        </div>

        {/* Remote Assistance & Nequi Section */}
        {mode === "remota" ? (
          <>
            <div className="flex flex-col gap-4 rounded-3xl border-2 border-purple-200 bg-purple-50/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-purple-900 text-sm uppercase tracking-wide">
                  <span>🌐</span> Instrucciones para la Asistencia Remota
                </h3>
                <span className="rounded-full bg-purple-200 px-2.5 py-0.5 text-[10px] font-black text-purple-900">
                  100% Virtual
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs font-medium text-purple-950">
                <div className="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm border border-purple-100">
                  <span className="text-base">1️⃣</span>
                  <div>
                    <strong>Conexión el Día del Evento:</strong> Ingresa desde tu celular o computadora a este mismo enlace o a <span className="font-mono text-purple-700">https://babyrevela.vercel.app/</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm border border-purple-100">
                  <span className="text-base">2️⃣</span>
                  <div>
                    <strong>Sonido & Notificaciones:</strong> Mantén el volumen de tu dispositivo activado para escuchar las alertas de votación y cuenta regresiva.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm border border-purple-100">
                  <span className="text-base">3️⃣</span>
                  <div>
                    <strong>Vota en Vivo:</strong> Elige tu Team (Niño 👦 o Niña 👧) en cuanto el Anfitrión abra la votación.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={playTestChime}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-purple-300 bg-white py-3 text-xs font-extrabold text-purple-950 shadow-sm transition hover:bg-purple-100"
                >
                  <span>🔊</span>
                  {soundTested
                    ? "✓ Sonido Verificado"
                    : "Probar Alerta de Sonido"}
                </button>
                <button
                  type="button"
                  onClick={requestNotification}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-purple-400 bg-purple-600 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-purple-700"
                >
                  <span>🔔</span>
                  {notifTested
                    ? "✓ Notificación Enviada"
                    : "Activar Notificaciones de Alerta"}
                </button>
              </div>
            </div>

            {/* Nequi Remote Gift Box */}
            <div className="flex flex-col gap-3 rounded-3xl border-2 border-emerald-300 bg-emerald-50/90 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-emerald-950 text-sm uppercase tracking-wide">
                  <span>📲</span> Detalle desde la Distancia (Nequi)
                </h3>
                <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-900">
                  Nequi
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-900/90 leading-relaxed">
                Si quieres darnos un detalle especial desde la distancia para la llegada del bebé, puedes hacerlo a través de Nequi:
              </p>

              <div className="flex flex-col gap-2 rounded-2xl border-2 border-emerald-300 bg-white p-4 text-center shadow-sm">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Número Nequi:
                </span>
                <p className="font-mono text-2xl font-black text-emerald-900 tracking-wider">
                  302 607 6608
                </p>
                <span className="text-xs font-bold text-slate-700">
                  A nombre de: <span className="text-emerald-950 font-extrabold">MARIA VANEGAS</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("3026076608");
                    setNequiCopied(true);
                    setTimeout(() => setNequiCopied(false), 3000);
                  }}
                  className="mt-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-emerald-700"
                >
                  {nequiCopied ? "✓ Número Nequi Copiado" : "📋 Copiar Número Nequi (3026076608)"}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Presencial Gift Guide Banner & Location Instructions */
          <>
            <div className="flex flex-col gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wide">
                  Guía de Detalles para Compartir
                </h3>
              </div>
              <p className="text-xs font-semibold text-amber-900/90 leading-relaxed">
                Trae tu predicción reflejada en un detalle especial para el bebé y algo rico para la mesa:
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                <div className="flex flex-col gap-1 rounded-xl border border-sky-200 bg-sky-50/90 p-3 text-xs">
                  <span className="font-extrabold text-sky-900 flex items-center gap-1.5">
                    💙 Si crees que es NIÑO:
                  </span>
                  <p className="font-medium text-sky-800">
                    Un <strong>Kit de Aseo para Bebé</strong> + un <strong>mecato/snack azul</strong> para compartir en la fiesta.
                  </p>
                </div>

                <div className="flex flex-col gap-1 rounded-xl border border-pink-200 bg-pink-50/90 p-3 text-xs">
                  <span className="font-extrabold text-pink-900 flex items-center gap-1.5">
                    💗 Si crees que es NIÑA:
                  </span>
                  <p className="font-medium text-pink-800">
                    Un <strong>accesorio de bebé niña</strong> (balaca, lazo o ropita) + un <strong>mecato/snack rosa</strong> para compartir.
                  </p>
                </div>
              </div>
            </div>

            {/* Presencial Location & Route Directions */}
            <div className="flex flex-col gap-4 rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-sky-950 text-sm uppercase tracking-wide">
                  <span>📍</span> Ubicación e Indicaciones de Cómo Llegar
                </h3>
                <span className="rounded-full bg-sky-200 px-2.5 py-0.5 text-[10px] font-black text-sky-900">
                  El Poblado
                </span>
              </div>

              <div className="flex flex-col gap-1 rounded-2xl border border-sky-200 bg-white p-3.5 shadow-sm">
                <span className="text-xs font-black uppercase text-sky-900 tracking-wide">Dirección Exacta:</span>
                <p className="font-extrabold text-slate-800 text-sm">
                  Carrera 15 #9a-36. Casa 107. Cola del Zorro, El Poblado
                </p>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1 w-fit border border-amber-200 mt-1">
                  Referencia Clave: &quot;Urbanización Zándalo&quot;
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-sky-100 bg-white p-3.5 shadow-sm text-xs font-semibold text-slate-700">
                <span className="font-extrabold text-sky-900 uppercase text-[11px] tracking-wide">
                  Sigue exactamente estas indicaciones de ruta:
                </span>
                <ol className="flex flex-col gap-2 list-decimal list-inside pl-1 text-slate-700 leading-relaxed">
                  <li>Subir por toda la 10 de El Poblado hasta la Cola del Zorro.</li>
                  <li>Subiendo a mano derecha encontrarás una Urbanización que se llama <strong>Zándalo</strong>.</li>
                  <li>Cuando llegues a la portería de esa Urbanización encontrarás justo al frente una calle (un portal para ingresar).</li>
                  <li>Entras por el portal y es la segunda casa a mano izquierda: <strong>Casa 107</strong>.</li>
                </ol>
              </div>

              {/* Entrance Image Preview & Fullscreen Option */}
              <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-sky-200 bg-white p-3.5 shadow-sm text-center">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <span>📷</span> Foto de Referencia de la Entrada (para no perderte):
                </span>
                <div
                  onClick={() => setFullScreenImageOpen(true)}
                  className="group relative h-52 w-full overflow-hidden rounded-xl border border-slate-200 cursor-pointer shadow-md transition hover:opacity-95"
                >
                  <img
                    src="/imagen_entrada.jpeg"
                    alt="Foto de Referencia de la Entrada"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-xl">
                      🔍 Ver en Pantalla Completa
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFullScreenImageOpen(true)}
                  className="w-full rounded-xl border border-sky-300 bg-sky-100 py-2.5 text-xs font-extrabold text-sky-950 shadow-sm transition hover:bg-sky-200"
                >
                  🔍 Ampliar Imagen en Pantalla Completa
                </button>
              </div>
            </div>
          </>
        )}

        {/* RSVP Form / Confirmation Status */}
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5 rounded-3xl border-2 border-emerald-300 bg-emerald-50/90 p-6 text-center shadow-md"
          >
            <span className="text-5xl animate-bounce">🎉</span>
            <h3 className="font-display text-2xl text-emerald-950">
              ¡Gracias por confirmar, {name}!
            </h3>
            <p className="text-sm font-semibold text-emerald-900 leading-relaxed max-w-md">
              {attending
                ? mode === "remota"
                  ? "¡Tu asistencia remota ha sido registrada con éxito! Te esperaremos con los brazos abiertos en la transmisión en vivo."
                  : `Tu asistencia presencial ha sido registrada con éxito (${guestsCount} persona/s). ¡Nos vemos en la fiesta!`
                : "Lamentamos que no puedas acompañarnos, ¡pero agradecemos mucho tu lindo mensaje!"}
            </p>

            {/* Presencial Location Details & Maps Navigation */}
            {attending && mode === "presencial" && (
              <div className="w-full flex flex-col gap-3 rounded-2xl border-2 border-sky-300 bg-white p-4 shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                  <span className="text-xs font-black uppercase tracking-wide text-sky-950 flex items-center gap-1.5">
                    <span>📍</span> Dirección e Indicaciones para Llegar
                  </span>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-900">
                    El Poblado
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="font-extrabold text-slate-800 text-sm">
                    Carrera 15 #9a-36. Casa 107. Cola del Zorro, El Poblado
                  </p>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 rounded-lg px-2.5 py-0.5 w-fit border border-amber-200">
                    Referencia Clave: &quot;Urbanización Zándalo&quot;
                  </span>
                </div>

                <ol className="flex flex-col gap-1.5 list-decimal list-inside text-xs font-semibold text-slate-700 bg-sky-50/70 p-3 rounded-xl border border-sky-100">
                  <li>Subir por toda la 10 de El Poblado hasta la Cola del Zorro.</li>
                  <li>Subiendo a mano derecha encontrarás la Urbanización <strong>Zándalo</strong>.</li>
                  <li>Al frente de la portería verás un portal para ingresar a la calle.</li>
                  <li>Entras por el portal y es la segunda casa a mano izquierda: <strong>Casa 107</strong>.</li>
                </ol>

                {/* Entrance Image Preview */}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <div
                    onClick={() => setFullScreenImageOpen(true)}
                    className="group relative h-44 w-full overflow-hidden rounded-xl border border-slate-200 cursor-pointer shadow-sm transition hover:opacity-95"
                  >
                    <img
                      src="/imagen_entrada.jpeg"
                      alt="Foto de la Entrada"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow">
                        🔍 Pantalla Completa
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFullScreenImageOpen(true)}
                    className="w-full rounded-xl border border-sky-300 bg-sky-50 py-2 text-xs font-extrabold text-sky-950 hover:bg-sky-100 transition shadow-sm"
                  >
                    📷 Ver Imagen de la Entrada en Pantalla Completa
                  </button>
                </div>

                {/* GPS Maps Navigation Buttons */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-extrabold uppercase text-slate-500 text-center">
                    🗺️ Abrir Ruta en tu Aplicación de Mapas:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Carrera 15 #9a-36 Casa 107 Cola del Zorro El Poblado Medellin Urbanizacion Zandalo")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 py-2.5 text-xs font-black text-blue-900 shadow-sm transition hover:bg-blue-100"
                    >
                      <span>🗺️</span> Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent("Urbanización Zándalo El Poblado Medellín")}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-300 bg-sky-500 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-sky-600"
                    >
                      <span>🚗</span> Waze
                    </a>
                    <a
                      href={`https://maps.apple.com/?q=${encodeURIComponent("Carrera 15 #9a-36 Medellin")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 py-2.5 text-xs font-black text-slate-800 shadow-sm transition hover:bg-slate-200"
                    >
                      <span>📱</span> Apple Maps
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/"
                className="rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 px-6 py-3.5 font-extrabold text-white shadow-lg transition hover:shadow-xl"
              >
                🗳️ Ir a la App a Votar en Vivo
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-sm font-extrabold uppercase tracking-wide text-slate-700">
                {mode === "remota"
                  ? "🌐 Confirma tu Conexión Remota"
                  : "✍️ Confirma tu Asistencia Presencial (RSVP)"}
              </span>
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rsvpName" className="text-xs font-bold text-slate-600">
                Tu nombre o apodo:
              </label>
              <input
                id="rsvpName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Tío Carlos 🌟"
                maxLength={28}
                required
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Attendance Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">
                {mode === "remota"
                  ? "¿Te conectarás en vivo el día de la revelación?"
                  : "¿Nos acompañarás presencialmente en la fiesta?"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttending(true)}
                  className={`rounded-2xl border-2 py-3 text-sm font-extrabold transition ${
                    attending
                      ? "border-emerald-500 bg-emerald-500 text-white shadow"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {mode === "remota" ? "¡Sí, me conectaré! 🌐" : "¡Sí asistiré! 🎉"}
                </button>
                <button
                  type="button"
                  onClick={() => setAttending(false)}
                  className={`rounded-2xl border-2 py-3 text-sm font-extrabold transition ${
                    !attending
                      ? "border-rose-500 bg-rose-500 text-white shadow"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  No podré estar 😢
                </button>
              </div>
            </div>

            {/* Guests Count (Only for Presencial) */}
            {mode === "presencial" && attending && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="guestsCount" className="text-xs font-bold text-slate-600">
                  ¿Cuántas personas van contigo (incluyéndote)?
                </label>
                <select
                  id="guestsCount"
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white"
                >
                  <option value={1}>1 persona (solo yo)</option>
                  <option value={2}>2 personas</option>
                  <option value={3}>3 personas</option>
                  <option value={4}>4 personas o más</option>
                </select>
              </div>
            )}

            {/* Warm Message Optional */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-xs font-bold text-slate-600">
                Mensaje o felicitación para los papás (opcional):
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="¡Les envío un abrazo enorme!"
                rows={2}
                maxLength={200}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </div>

            {errorMsg && (
              <p className="text-center text-xs font-bold text-rose-500">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={!valid || submitting}
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 py-4 font-extrabold text-white shadow-xl transition hover:shadow-2xl disabled:opacity-40"
            >
              {submitting ? "Enviando confirmación…" : "✉️ Enviar Confirmación"}
            </button>
          </form>
        )}
      </motion.div>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullScreenImageOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative flex flex-col items-center gap-4 max-w-3xl w-full"
            >
              <button
                type="button"
                onClick={() => setFullScreenImageOpen(false)}
                className="self-end rounded-full bg-white/20 p-2.5 text-white hover:bg-white/40 transition font-bold text-lg"
              >
                ✕ Cerrar Pantalla Completa
              </button>
              <div className="overflow-hidden rounded-2xl border-4 border-white shadow-2xl max-h-[80vh] w-full flex items-center justify-center bg-black">
                <img
                  src="/imagen_entrada.jpeg"
                  alt="Imagen de Referencia de la Entrada - Pantalla Completa"
                  className="max-h-[80vh] w-full object-contain"
                />
              </div>
              <p className="text-center text-xs font-bold text-white/90">
                Referencia: Frente a la portería de la Urbanización Zándalo (Cola del Zorro). Casa 107.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Footer */}
      <footer className="flex flex-col items-center gap-2 text-center">
        <Link
          href="/"
          className="text-xs font-extrabold text-slate-600 underline decoration-dotted hover:text-slate-900"
        >
          🏠 Regresar a la Página Principal de Baby Revela
        </Link>
        <p className="text-[11px] font-bold text-slate-400">
          Baby Revela • Desarrollado con ❤️ por <span className="text-slate-600">ChrizDev (Christian Romero)</span>
        </p>
      </footer>
    </div>
  );
}

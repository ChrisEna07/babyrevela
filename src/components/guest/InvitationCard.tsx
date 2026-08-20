"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { submitRSVP, subscribeParentsNames } from "@/lib/db";
import { EVENT_NAME, EVENT_TAGLINE } from "@/lib/constants";

export function InvitationCard() {
  const [parentsNames, setParentsNamesState] = useState<string>("Mamá & Papá");
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean>(true);
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const unsub = subscribeParentsNames(setParentsNamesState);
    return () => unsub();
  }, []);

  const valid = name.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      await submitRSVP(name, attending, guestsCount, message);
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
          Invitación Oficial al Baby Shower
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
            ¡Nos encantaría contar con tu presencia! 🎉
          </p>
          <p className="text-sm font-semibold leading-relaxed text-slate-600">
            {parentsNames} están muy felices de celebrar la llegada de su bebé junto a las personas más especiales. Ven a compartir risas, emoción y el inolvidable momento de la revelación de sexo.
          </p>
        </div>

        {/* Gift Guide Banner */}
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

        {/* RSVP Form / Confirmation Status */}
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center shadow-md"
          >
            <span className="text-5xl">🎉</span>
            <h3 className="font-display text-2xl text-emerald-900">
              ¡Gracias por confirmar, {name}!
            </h3>
            <p className="text-sm font-semibold text-emerald-800">
              {attending
                ? `Tu asistencia ha sido registrada con éxito (${guestsCount} persona/s). ¡Nos vemos en la fiesta!`
                : "Lamentamos que no puedas acompañarnos, ¡pero agradecemos mucho tu lindo mensaje!"}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/"
                className="rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 px-6 py-3 font-extrabold text-white shadow-lg transition hover:shadow-xl"
              >
                🗳️ Ir a la App a Votar en Vivo
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-sm font-extrabold uppercase tracking-wide text-slate-700">
                ✍️ Confirma tu Asistencia (RSVP)
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
                placeholder="Ej. Tía Mary 🌟"
                maxLength={28}
                required
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Attendance Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">
                ¿Nos acompañarás en la fiesta?
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
                  ¡Sí asistiré! 🎉
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
                  No podré ir 😢
                </button>
              </div>
            </div>

            {/* Guests Count */}
            {attending && (
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
                placeholder="¡Les deseo lo mejor en esta hermosa etapa!"
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
              {submitting ? "Enviando confirmación…" : "✉️ Enviar Confirmación de Asistencia"}
            </button>
          </form>
        )}
      </motion.div>

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

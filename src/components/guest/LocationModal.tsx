"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { DEFAULT_LOCATION, subscribeEventLocation } from "@/lib/db";
import type { EventLocation } from "@/lib/types";

export function LocationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [fullScreenImage, setFullScreenImage] = useState(false);
  const [location, setLocation] = useState<EventLocation>(DEFAULT_LOCATION);

  useEffect(() => {
    const unsub = subscribeEventLocation(setLocation);
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const address = location.address || DEFAULT_LOCATION.address;
  const reference = location.reference || DEFAULT_LOCATION.reference;
  const photoUrl = location.photoUrl || DEFAULT_LOCATION.photoUrl;
  const googleMapsUrl = location.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const wazeUrl = location.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  const appleMapsUrl = location.appleMapsUrl || `https://maps.apple.com/?q=${encodeURIComponent(address)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-3xl border-4 border-white bg-white p-6 shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-black text-slate-500 hover:bg-slate-200 transition"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-2xl">📍</span>
            <div>
              <h2 className="font-display text-xl text-slate-800">
                Ubicación e Indicaciones del Evento
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Guía completa para llegar fácilmente al recinto presencial
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {/* Address Header Card */}
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
              <span className="text-[11px] font-black uppercase text-amber-900">
                🏠 Dirección Exacta del Evento:
              </span>
              <p className="font-display text-lg text-amber-950 mt-0.5 leading-snug">
                {address}
              </p>
            </div>

            {/* Step by Step Route / Reference Note */}
            <div className="flex flex-col gap-2 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-xs font-semibold text-slate-700">
              <span className="font-black text-sky-950 uppercase tracking-wide">
                🧭 Referencia / Indicaciones de Llegada:
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {reference}
              </p>
            </div>

            {/* Photo of Entrance */}
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs font-extrabold text-slate-700">
                📸 Imagen de Referencia de la Entrada / Lugar:
              </span>
              <div
                onClick={() => setFullScreenImage(true)}
                className="relative h-48 w-full cursor-pointer overflow-hidden rounded-xl border border-slate-300 shadow-sm transition hover:opacity-95 bg-slate-900 flex items-center justify-center"
              >
                <img
                  src={photoUrl}
                  alt="Foto de la entrada del evento"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur">
                  🔍 Clic para ampliar
                </span>
              </div>
            </div>

            {/* GPS Navigation Links */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 text-center">
                🗺️ Abrir Ruta en tu Aplicación de Mapas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 py-2.5 text-xs font-black text-blue-900 shadow-sm transition hover:bg-blue-100"
                >
                  <span>🗺️</span> Google Maps
                </a>
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-300 bg-sky-500 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-sky-600"
                >
                  <span>🚗</span> Waze
                </a>
                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 py-2.5 text-xs font-black text-slate-800 shadow-sm transition hover:bg-slate-200"
                >
                  <span>📱</span> Apple Maps
                </a>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-2 w-full rounded-2xl bg-slate-800 py-3 text-xs font-extrabold text-white shadow transition hover:bg-slate-900"
            >
              ¡Entendido! Volver al Evento
            </button>
          </div>
        </motion.div>

        {/* Fullscreen Image Lightbox Modal */}
        {fullScreenImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative flex flex-col items-center gap-4 max-w-3xl w-full"
            >
              <button
                onClick={() => setFullScreenImage(false)}
                className="self-end rounded-full bg-white/20 p-2.5 text-white hover:bg-white/40 transition font-bold text-lg"
              >
                ✕ Cerrar Pantalla Completa
              </button>
              <div className="overflow-hidden rounded-2xl border-4 border-white shadow-2xl max-h-[80vh] w-full flex items-center justify-center bg-black">
                <img
                  src={photoUrl}
                  alt="Imagen de la entrada - Pantalla Completa"
                  className="max-h-[80vh] w-full object-contain"
                />
              </div>
              <p className="text-center text-xs font-bold text-white/90">
                {reference}
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}

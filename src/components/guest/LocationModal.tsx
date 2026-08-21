"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function LocationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [fullScreenImage, setFullScreenImage] = useState(false);

  if (!isOpen) return null;

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
                🏠 Dirección Exacta:
              </span>
              <p className="font-display text-lg text-amber-950 mt-0.5">
                Carrera 15 #9a-36. Casa 107
              </p>
              <p className="text-xs font-bold text-amber-900/90 mt-0.5">
                Cola del Zorro, El Poblado · <strong>Referencia: Urbanización Zándalo</strong>
              </p>
            </div>

            {/* Step by Step Route */}
            <div className="flex flex-col gap-2 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-xs font-semibold text-slate-700">
              <span className="font-black text-sky-950 uppercase tracking-wide">
                🧭 Indicaciones Paso a Paso:
              </span>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 leading-relaxed">
                <li>Subir por toda la 10 de El Poblado hasta la Cola del Zorro.</li>
                <li>Subiendo a mano derecha encontrarás una Urbanización llamada <strong>Zándalo</strong>.</li>
                <li>Al llegar a la portería de esa Urbanización, verás justo al frente una calle (un portal para ingresar).</li>
                <li>Entras por el portal y es la segunda casa a mano izquierda: <strong>Casa 107</strong>.</li>
              </ol>
            </div>

            {/* Photo of Entrance */}
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs font-extrabold text-slate-700">
                📸 Imagen de Referencia de la Entrada:
              </span>
              <div
                onClick={() => setFullScreenImage(true)}
                className="relative h-44 w-full cursor-pointer overflow-hidden rounded-xl border border-slate-300 shadow-sm transition hover:opacity-95"
              >
                <img
                  src="/imagen_entrada.jpeg"
                  alt="Foto de la entrada Casa 107"
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

          <button
            onClick={onClose}
            className="mt-5 w-full rounded-2xl bg-slate-900 py-3 text-xs font-extrabold text-white shadow transition hover:bg-slate-800"
          >
            Entendido, cerrar mapita 🗺️
          </button>

          {/* Fullscreen Entrance Image Modal */}
          {fullScreenImage && (
            <div
              onClick={() => setFullScreenImage(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            >
              <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl">
                <img
                  src="/imagen_entrada.jpeg"
                  alt="Entrada Casa 107 Pantalla Completa"
                  className="max-h-[85vh] w-auto object-contain rounded-2xl"
                />
                <button
                  onClick={() => setFullScreenImage(false)}
                  className="absolute top-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900 shadow"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

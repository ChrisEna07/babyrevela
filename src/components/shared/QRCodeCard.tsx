"use client";

import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export function QRCodeCard({
  url = "https://babyrevela.vercel.app/",
  title = "Escanea para Votar 📱",
}: {
  url?: string;
  title?: string;
}) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-sky-200 bg-white/90 p-5 text-center shadow-lg backdrop-blur">
        <h3 className="font-display text-xl text-slate-800">{title}</h3>
        <p className="max-w-xs text-xs font-semibold text-slate-500">
          Escanea el código QR desde tu teléfono para ingresar directamente a votar sin escribir la URL:
        </p>

        <div
          onClick={() => setFullscreen(true)}
          className="group relative cursor-pointer rounded-2xl border-4 border-slate-100 bg-white p-3.5 shadow-md transition hover:scale-105 hover:border-sky-300 hover:shadow-xl"
        >
          <QRCodeSVG
            value={url}
            size={180}
            bgColor="#ffffff"
            fgColor="#1e293b"
            level="H"
            marginSize={1}
          />
          <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-extrabold text-white opacity-0 transition group-hover:opacity-100">
            🔍 Agrandar
          </span>
        </div>

        <p className="font-mono text-xs font-extrabold text-sky-600 underline">
          {url}
        </p>

        <button
          onClick={() => setFullscreen(true)}
          className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-extrabold text-sky-900 shadow-sm transition hover:bg-sky-100"
        >
          🔎 Ver QR en pantalla completa
        </button>
      </div>

      {fullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setFullscreen(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-4 rounded-3xl border-4 border-white bg-white p-8 text-center shadow-2xl"
          >
            <h2 className="font-display text-3xl text-gold-dark">
              ¡Escanea y Vota! 🎈
            </h2>
            <p className="text-sm font-semibold text-slate-600">
              Apunta la cámara de tu teléfono al código QR:
            </p>

            <div className="rounded-3xl border-4 border-slate-100 bg-white p-5 shadow-inner">
              <QRCodeSVG
                value={url}
                size={280}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="H"
                marginSize={1}
              />
            </div>

            <p className="font-mono text-sm font-extrabold text-indigo-600">
              {url}
            </p>

            <button
              onClick={() => setFullscreen(false)}
              className="rounded-2xl bg-slate-800 px-6 py-3 font-extrabold text-white shadow-lg transition hover:bg-slate-900"
            >
              Cerrar ✖
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

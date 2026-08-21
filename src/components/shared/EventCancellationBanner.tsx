"use client";

import { useEffect, useState } from "react";
import { subscribeEventCancellation } from "@/lib/db";
import type { EventCancellation } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export function EventCancellationBanner() {
  const [cancellation, setCancellation] = useState<EventCancellation | null>(null);

  useEffect(() => {
    const unsub = subscribeEventCancellation(setCancellation);
    return () => unsub();
  }, []);

  if (!cancellation || cancellation.status === "activo") return null;

  const isPostponed = cancellation.status === "aplazado";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        className={`w-full rounded-3xl border-4 p-5 shadow-2xl text-center backdrop-blur mb-4 ${
          isPostponed
            ? "border-amber-400 bg-amber-100/95 text-amber-950"
            : "border-rose-500 bg-rose-100/95 text-rose-950"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl animate-bounce">
            {isPostponed ? "⏳" : "🚫"}
          </span>
          <h2 className="font-display text-2xl font-black uppercase tracking-wider">
            {isPostponed ? "¡EVENTO APLAZADO!" : "¡EVENTO CANCELADO!"}
          </h2>
          {cancellation.reason ? (
            <div className="mt-1 rounded-2xl bg-white/90 p-3.5 border border-current max-w-md shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 block">
                📢 Comunicado Oficial de los Padres / Anfitrión:
              </span>
              <p className="text-sm font-extrabold leading-relaxed mt-1 text-slate-900">
                &quot;{cancellation.reason}&quot;
              </p>
            </div>
          ) : (
            <p className="text-xs font-semibold">
              {isPostponed
                ? "El evento ha sido aplazado temporalmente. Por favor mantente atento a esta pantalla o a tu WhatsApp para conocer la nueva fecha."
                : "Lamentablemente el evento ha sido cancelado. Agradecemos mucho tu comprensión y cariño."}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

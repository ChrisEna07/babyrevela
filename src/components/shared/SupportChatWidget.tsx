"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { GUEST_KEY } from "@/lib/constants";
import { sendSupportMessage, subscribeSupportChats } from "@/lib/db";
import type { SupportChatMessage } from "@/lib/types";

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [guestName, setGuestName] = useState(() => {
    if (typeof window === "undefined") return "";
    const raw = localStorage.getItem(GUEST_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.name) return parsed.name;
      } catch {}
    }
    return "";
  });

  const [myChatIds, setMyChatIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("my_support_chat_ids");
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [messageText, setMessageText] = useState("");
  const [chats, setChats] = useState<SupportChatMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [errorToast, setErrorToast] = useState("");

  useEffect(() => {
    const unsub = subscribeSupportChats(setChats);
    return () => unsub();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorToast("");
    setSuccessToast("");

    if (!guestName.trim()) {
      setErrorToast("Por favor ingresa tu nombre antes de enviar.");
      return;
    }
    if (!messageText.trim()) return;

    setSubmitting(true);
    try {
      const chatId = await sendSupportMessage(guestName.trim(), messageText.trim());
      const updatedIds = Array.from(new Set([...myChatIds, chatId]));
      setMyChatIds(updatedIds);
      if (typeof window !== "undefined") {
        localStorage.setItem("my_support_chat_ids", JSON.stringify(updatedIds));
      }
      setMessageText("");
      setSuccessToast("✨ ¡Mensaje enviado al Anfitrión! Te responderemos aquí mismo.");
      setTimeout(() => setSuccessToast(""), 5000);
    } catch (err) {
      console.error("Support chat error:", err);
      setErrorToast("⚠️ Error al enviar mensaje. Por favor intenta de nuevo.");
      setTimeout(() => setErrorToast(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const myChats = chats.filter((c) => myChatIds.includes(c.id));
  const hasUnanswered = myChats.some((c) => c.status === "answered");

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 px-4 py-3 text-xs font-black text-white shadow-2xl transition hover:scale-105 border-2 border-white"
        >
          <span className="text-base">💬</span>
          <span>¿Tienes dudas? Chat con Anfitrión</span>
          {hasUnanswered && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white animate-pulse">
              1
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-20 right-5 z-50 w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="flex flex-col rounded-3xl border-4 border-white bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-xl max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <div>
                    <h3 className="font-display text-sm text-pink-300">
                      Chat de Preguntas y Soporte
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-300">
                      Escribe tus dudas al Anfitrión / Súper Admin
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full bg-slate-800 p-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
                >
                  ✕
                </button>
              </div>

              {/* Chat History Container */}
              <div className="my-3 flex flex-1 flex-col gap-2.5 overflow-y-auto max-h-60 pr-1 text-xs">
                {myChats.length === 0 ? (
                  <p className="p-4 text-center text-[11px] font-medium text-slate-400">
                    ¿Tienes alguna duda sobre la ubicación, regalos o la hora de la revelación? ¡Escríbela abajo!
                  </p>
                ) : (
                  myChats.map((c) => (
                    <div key={c.id} className="flex flex-col gap-1.5 rounded-2xl bg-slate-800/90 p-3 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-pink-400">
                          {c.guestName}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-100 font-medium">
                        &ldquo;{c.message}&rdquo;
                      </p>

                      {c.response ? (
                        <div className="mt-1 rounded-xl bg-emerald-950/80 p-2.5 border border-emerald-500/40 text-emerald-200">
                          <span className="text-[10px] font-black uppercase text-emerald-400 block mb-0.5">
                            👑 Respuesta del Súper Admin / Anfitrión:
                          </span>
                          <p className="text-xs font-semibold">
                            {c.response}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-400 italic">
                          ⏳ Esperando respuesta del anfitrión...
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Form Input */}
              <form onSubmit={handleSendMessage} className="flex flex-col gap-2 pt-2 border-t border-slate-700/80">
                {successToast && (
                  <p className="rounded-xl bg-emerald-900/90 p-2 text-center text-[10px] font-bold text-emerald-200 border border-emerald-500">
                    {successToast}
                  </p>
                )}
                {errorToast && (
                  <p className="rounded-xl bg-rose-900/90 p-2 text-center text-[10px] font-bold text-rose-200 border border-rose-500">
                    {errorToast}
                  </p>
                )}

                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Tu nombre (Ej. María)"
                  required
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-pink-500"
                />

                <div className="flex items-center gap-2">
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Escribe tu duda aquí..."
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-pink-500"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-pink-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-pink-700 transition shrink-0 disabled:opacity-50"
                  >
                    {submitting ? "..." : "Enviar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

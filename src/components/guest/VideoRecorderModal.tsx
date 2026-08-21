"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function VideoRecorderModal({
  isOpen,
  onClose,
  onSaveVideo,
  existingVideoUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaveVideo: (videoUrl: string) => void;
  existingVideoUrl?: string;
}) {
  const [videoPreview, setVideoPreview] = useState<string | null>(existingVideoUrl || null);
  const [prevUrl, setPrevUrl] = useState(existingVideoUrl);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (existingVideoUrl !== prevUrl) {
    setPrevUrl(existingVideoUrl);
    setVideoPreview(existingVideoUrl || null);
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (cameraActive && streamRef.current && liveVideoRef.current) {
      liveVideoRef.current.srcObject = streamRef.current;
      liveVideoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  const startCamera = async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("No se pudo acceder a la cámara o micrófono. Puedes seleccionar un video de tus archivos.");
    }
  };

  const handleStartRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : MediaRecorder.isTypeSupported("video/mp4")
            ? "video/mp4"
            : "",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoPreview(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stopCamera();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 9) {
            handleStopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al iniciar grabación.");
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 35 * 1024 * 1024) {
      setErrorMsg("El video supera los 35MB. Por favor selecciona un clip más corto (10-30 seg).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSave = () => {
    if (videoPreview) {
      onSaveVideo(videoPreview);
      onClose();
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={handleCloseModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="flex w-full max-w-md flex-col gap-4 rounded-3xl border-4 border-pink-400 bg-white p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black uppercase text-pink-950 flex items-center gap-1.5">
              <span>📹</span> Video Saludo y Predicción (Collage TikTok)
            </span>
            <button
              onClick={handleCloseModal}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-600 hover:bg-slate-200"
            >
              ✕
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-600 leading-relaxed">
            ¡Graba o sube un video corto (máx 10 seg) diciendo quién eres (ej. <i>Tía, Prima, Abuela</i>) y si crees que será <strong>Niño 👦</strong> o <strong>Niña 👧</strong>!
          </p>

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-900">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Video Display Area */}
          <div className="relative flex min-h-[220px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-pink-300 bg-slate-900">
            {videoPreview ? (
              <video
                src={videoPreview}
                controls
                autoPlay
                className="max-h-[280px] w-full object-contain"
              />
            ) : cameraActive ? (
              <video
                ref={liveVideoRef}
                autoPlay
                playsInline
                muted
                className="max-h-[280px] w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 p-6 text-center text-white">
                <span className="text-4xl animate-pulse">🎬</span>
                <span className="text-xs font-extrabold">Ningún video seleccionado o grabado</span>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white shadow animate-pulse">
                <span>🔴 REC</span>
                <span>{recordingSeconds}s / 10s</span>
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="flex flex-col gap-2.5">
            {!cameraActive && !videoPreview && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 py-3 text-xs font-black text-white shadow transition hover:opacity-95"
                >
                  📹 Activar Cámara
                </button>
                <label className="flex cursor-pointer items-center justify-center rounded-2xl bg-slate-800 py-3 text-xs font-black text-white shadow transition hover:bg-slate-900">
                  📁 Cargar Archivo
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {cameraActive && !videoPreview && (
              <div className="flex gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="flex-1 rounded-2xl bg-rose-600 py-3 text-xs font-black text-white shadow transition hover:bg-rose-700"
                  >
                    🔴 Iniciar Grabación (10s)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="flex-1 rounded-2xl bg-slate-800 py-3 text-xs font-black text-white shadow transition hover:bg-slate-900"
                  >
                    ⏹️ Detener Grabación
                  </button>
                )}
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-2xl bg-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            )}

            {videoPreview && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVideoPreview(null);
                    stopCamera();
                  }}
                  className="rounded-2xl bg-rose-100 px-4 py-3 text-xs font-extrabold text-rose-800 hover:bg-rose-200"
                >
                  🔄 Volver a Grabar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow transition hover:bg-emerald-700"
                >
                  ✅ Adjuntar Este Video
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

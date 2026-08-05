"use client";

import { useEffect, useState } from "react";
import { subscribeConnection } from "@/lib/db";

export function ConnectionPill() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => subscribeConnection(setOnline), []);

  if (online === null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
        online ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          online ? "animate-pulse bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {online ? "En vivo" : "Reconectando…"}
    </span>
  );
}

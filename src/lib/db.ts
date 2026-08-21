import {
  child,
  get,
  onValue,
  push,
  ref,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";
import { getRTDB } from "./firebase";
import { sha256Hex } from "./hash";
import type {
  AppState,
  EventSchedule,
  HistoricalSession,
  RSVP,
  RSVPMap,
  RevealerInfo,
  SuperAdminInfo,
  Team,
  Vote,
  VoteLogEntry,
  VoteMap,
  VoteTotals,
} from "./types";

const db = () => getRTDB();

export function subscribeState(callback: (state: AppState) => void): Unsubscribe {
  return onValue(
    ref(db(), "state"),
    (snapshot) => {
      const raw = snapshot.val();
      if (!raw) return;
      callback({
        votingOpen: Boolean(raw.votingOpen),
        phase: (raw.phase as AppState["phase"]) ?? "idle",
        countdownEndsAt: raw.countdownEndsAt ?? null,
        countdownDuration: raw.countdownDuration ?? 10,
        revealChoice: raw.revealChoice ?? null,
      });
    },
    (error) => console.error("Error leyendo state:", error)
  );
}

export function setParentsNames(names: string): Promise<void> {
  return set(ref(db(), "meta/parentsNames"), names.trim());
}

export function subscribeParentsNames(callback: (names: string) => void): Unsubscribe {
  return onValue(
    ref(db(), "meta/parentsNames"),
    (snapshot) => {
      const val = snapshot.val();
      callback(typeof val === "string" ? val : "Mamá & Papá");
    },
    (error) => console.error("Error leyendo parentsNames:", error)
  );
}

export function subscribeVotes(callback: (votes: VoteMap) => void): Unsubscribe {
  return onValue(
    ref(db(), "votes"),
    (snapshot) => {
      const raw = snapshot.val();
      if (!raw) return callback({});
      callback(raw as VoteMap);
    },
    (error) => console.error("Error leyendo votes:", error)
  );
}

export function subscribeVoteLog(
  callback: (entries: VoteLogEntry[]) => void
): Unsubscribe {
  return onValue(
    ref(db(), "voteLog"),
    (snapshot) => {
      const raw = snapshot.val();
      if (!raw) return callback([]);
      const entries = Object.values(raw)
        .filter((entry): entry is VoteLogEntry => {
          const e = entry as Partial<VoteLogEntry> | null;
          return (
            e !== null &&
            e !== undefined &&
            typeof e.at === "number" &&
            (e.team === "boy" || e.team === "girl")
          );
        })
        .sort((a, b) => a.at - b.at);
      callback(entries);
    },
    (error) => console.error("Error leyendo voteLog:", error)
  );
}

export function subscribeConnection(
  callback: (online: boolean) => void
): Unsubscribe {
  return onValue(ref(db(), ".info/connected"), (snapshot) =>
    callback(Boolean(snapshot.val()))
  );
}

export async function getPinHash(): Promise<string | null> {
  try {
    const snapshot = await get(child(ref(db()), "meta/pinHash"));
    return snapshot.val() ?? null;
  } catch (error) {
    console.error("Error leyendo meta/pinHash:", error);
    return null;
  }
}

export async function getHostInfo(): Promise<{ hostName: string | null; pinHash: string | null }> {
  try {
    const snapName = await get(child(ref(db()), "meta/hostName"));
    const snapHash = await get(child(ref(db()), "meta/pinHash"));
    return {
      hostName: snapName.val() ?? null,
      pinHash: snapHash.val() ?? null,
    };
  } catch (error) {
    console.error("Error leyendo info del anfitrión:", error);
    return { hostName: null, pinHash: null };
  }
}

export async function getSuperAdmin(): Promise<SuperAdminInfo | null> {
  try {
    const snapshot = await get(child(ref(db()), "meta/superAdmin"));
    return snapshot.val() ?? null;
  } catch (error) {
    console.error("Error leyendo meta/superAdmin:", error);
    return null;
  }
}

export async function validateSuperAdminCredentials(
  inputName: string,
  inputPin: string
): Promise<{ valid: boolean; name: string; pinHash: string }> {
  const hash = await sha256Hex(inputPin.trim());
  const cleanName = inputName.trim();
  const lowerName = cleanName.toLowerCase();

  // 1. ChrizDev (Developer SuperAdmin)
  if (lowerName === "chrizdev" && inputPin.trim() === "3008") {
    return { valid: true, name: "ChrizDev", pinHash: hash };
  }

  // 2. Maria (Mamá SuperAdmin)
  if ((lowerName === "maria" || lowerName === "maría" || lowerName === "maria vanegas") && inputPin.trim() === "1407") {
    return { valid: true, name: "Maria (Mamá)", pinHash: hash };
  }

  // 3. Dynamic SuperAdmin Node in RTDB
  try {
    const snapshot = await get(child(ref(db()), "meta/superAdmin"));
    const data = snapshot.val();
    if (
      data &&
      data.pinHash === hash &&
      data.name.trim().toLowerCase() === lowerName
    ) {
      return { valid: true, name: data.name, pinHash: hash };
    }
  } catch (error) {
    console.error("Error leyendo meta/superAdmin:", error);
  }

  return { valid: false, name: "", pinHash: "" };
}

export function subscribeEventSchedule(
  callback: (schedule: EventSchedule | null) => void
): Unsubscribe {
  return onValue(ref(db(), "meta/eventSchedule"), (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
}

export async function setEventSchedule(
  eventDate: string,
  eventTime: string,
  revealTime: string
): Promise<void> {
  await set(ref(db(), "meta/eventSchedule"), {
    eventDate: eventDate.trim(),
    eventTime: eventTime.trim(),
    revealTime: revealTime.trim(),
    updatedAt: Date.now(),
  });
}

export async function getRevealer(): Promise<RevealerInfo | null> {
  try {
    const snapshot = await get(child(ref(db()), "meta/revealer"));
    if (!snapshot.exists()) return { name: null, pinHash: null };
    const raw = snapshot.val();
    return {
      name: raw.name ?? null,
      pinHash: raw.pinHash ?? null,
    };
  } catch (error) {
    console.error("Error leyendo meta/revealer:", error);
    return null;
  }
}

export async function setRevealer(
  name: string,
  revealerPinHash: string,
  superPinHash: string
): Promise<void> {
  await set(ref(db(), "meta/revealer"), {
    name,
    pinHash: revealerPinHash,
    authHash: superPinHash,
  });
}

export async function castVote(
  guestId: string,
  name: string,
  team: Team
): Promise<void> {
  const vote: Vote = { name, team, updatedAt: Date.now() };
  const voteLogKey = push(ref(db(), "voteLog")).key!;
  await update(ref(db()), {
    [`votes/${guestId}`]: vote,
    [`voteLog/${voteLogKey}`]: { name, team, at: Date.now() },
  });
}

function adminUpdateState(
  patch: Partial<AppState>,
  pinHash: string
): Promise<void> {
  return update(ref(db(), "state"), { ...patch, pinHash });
}

export const adminOpenVoting = (pinHash: string) =>
  adminUpdateState({ votingOpen: true, phase: "voting" }, pinHash);

export const adminCloseVoting = (pinHash: string) =>
  adminUpdateState({ votingOpen: false, phase: "idle" }, pinHash);

export const adminStartCountdown = (
  durationSeconds: number,
  pinHash: string
) =>
  adminUpdateState(
    {
      votingOpen: false,
      phase: "countdown",
      countdownDuration: durationSeconds,
      countdownEndsAt: Date.now() + durationSeconds * 1000,
    },
    pinHash
  );

export const adminStartReveal = (
  team: Team,
  durationSeconds: number,
  pinHash: string
) =>
  adminUpdateState(
    {
      votingOpen: false,
      phase: "countdown",
      revealChoice: team,
      countdownDuration: durationSeconds,
      countdownEndsAt: Date.now() + durationSeconds * 1000,
    },
    pinHash
  );

export const adminReveal = (team: Team, pinHash: string) =>
  adminUpdateState(
    {
      phase: "revealed",
      revealChoice: team,
      votingOpen: false,
      countdownEndsAt: null,
    },
    pinHash
  );

export function subscribeHistory(
  cb: (history: HistoricalSession[]) => void
): () => void {
  const historyRef = ref(db(), "history");
  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val() as Record<string, HistoricalSession> | null;
    if (!data) {
      cb([]);
      return;
    }
    const list = Object.values(data).sort((a, b) => b.createdAt - a.createdAt);
    cb(list);
  });
}

export const adminReset = async (pinHash: string) => {
  try {
    const votesSnap = await get(ref(db(), "votes"));
    const votesData = (votesSnap.val() || {}) as VoteMap;
    const votesList = Object.values(votesData).filter(
      (v): v is Vote => Boolean(v) && (v.team === "boy" || v.team === "girl")
    );

    const stateSnap = await get(ref(db(), "state"));
    const stateData = stateSnap.val() as AppState | null;

    if (votesList.length > 0) {
      const totals = computeTotals(votesData);
      const sessionId = `session_${Date.now()}`;
      const newHistoryRef = ref(db(), `history/${sessionId}`);
      const dateStr = new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date());

      const historicalSession: HistoricalSession = {
        id: sessionId,
        createdAt: Date.now(),
        dateStr,
        revealChoice: stateData?.revealChoice ?? null,
        totals,
        votes: votesList,
      };

      await set(newHistoryRef, historicalSession);
    }
  } catch (err) {
    console.error("Error al archivar sesión:", err);
  }

  await adminUpdateState(
    {
      phase: "idle",
      votingOpen: false,
      revealChoice: null,
      countdownEndsAt: null,
      countdownDuration: 10,
    },
    pinHash
  );
  try {
    await set(ref(db(), "votes"), null);
    await set(ref(db(), "voteLog"), null);
  } catch (error) {
    console.error("Error borrando votos al restablecer:", error);
  }
};

export function computeTotals(votes: VoteMap): VoteTotals {
  const entries = Object.values(votes).filter(
    (v): v is Vote => Boolean(v) && (v.team === "boy" || v.team === "girl")
  );
  const boy = entries.filter((v) => v.team === "boy").length;
  const girl = entries.length - boy;
  const total = entries.length;
  const boyPercent = total ? Math.round((boy / total) * 100) : 0;
  const girlPercent = total ? 100 - boyPercent : 0;
  return { boy, girl, total, boyPercent, girlPercent };
}

export function bucketVotesByMinute(entries: VoteLogEntry[]): {
  label: string;
  boy: number;
  girl: number;
  total: number;
}[] {
  if (entries.length === 0) return [];
  const first = entries[0].at;
  const last = entries[entries.length - 1].at;
  const bucketSize = 60_000;
  const start = Math.floor(first / bucketSize) * bucketSize;
  const buckets: { label: string; boy: number; girl: number; total: number }[] = [];
  const formatter = new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
  for (let t = start; t <= last; t += bucketSize) {
    buckets.push({ label: formatter.format(new Date(t)), boy: 0, girl: 0, total: 0 });
  }
  for (const entry of entries) {
    const index = Math.min(
      Math.floor((entry.at - start) / bucketSize),
      buckets.length - 1
    );
    buckets[index][entry.team]++;
    buckets[index].total++;
  }
  return buckets;
}

export function submitRSVP(
  name: string,
  attending: boolean,
  guestsCount: number,
  message?: string,
  mode: "presencial" | "remota" = "presencial"
): Promise<void> {
  const id = `rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const rsvp: RSVP = {
    id,
    name: name.trim(),
    attending,
    guestsCount,
    mode,
    message: message?.trim() || "",
    createdAt: Date.now(),
  };
  return set(ref(db(), `rsvps/${id}`), rsvp);
}

export function subscribeRSVPs(
  callback: (rsvps: RSVP[]) => void
): Unsubscribe {
  return onValue(
    ref(db(), "rsvps"),
    (snapshot) => {
      const raw = snapshot.val() as RSVPMap | null;
      if (!raw) return callback([]);
      const list = Object.values(raw).sort((a, b) => b.createdAt - a.createdAt);
      callback(list);
    },
    (error) => {
      console.warn("Información de rsvps no disponible aún:", error.message);
      callback([]);
    }
  );
}

export function createHostSetupLink(superAdminPinHash: string): Promise<string> {
  const token = `setup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return set(ref(db(), "meta/hostSetupToken"), {
    token,
    createdAt: Date.now(),
    createdBy: superAdminPinHash,
    active: true,
  }).then(() => token);
}

export function getHostSetupTokenInfo(): Promise<{ token: string; active: boolean } | null> {
  return get(ref(db(), "meta/hostSetupToken")).then((snapshot) => {
    return snapshot.val() || null;
  });
}

export function completeHostSetup(
  token: string,
  hostName: string,
  newPinHash: string
): Promise<void> {
  return get(ref(db(), "meta/hostSetupToken")).then((snap) => {
    const data = snap.val();
    if (!data || data.token !== token || !data.active) {
      throw new Error("El enlace de configuración no es válido o ya fue utilizado.");
    }
    return Promise.all([
      set(ref(db(), "meta/pinHash"), newPinHash),
      set(ref(db(), "meta/hostName"), hostName),
      update(ref(db(), "meta/hostSetupToken"), { active: false, usedAt: Date.now() }),
    ]).then(() => undefined);
  });
}

export function resetHostCredentials(): Promise<void> {
  return Promise.all([
    set(ref(db(), "meta/pinHash"), null),
    set(ref(db(), "meta/hostName"), null),
    set(ref(db(), "meta/hostSetupToken"), null),
  ]).then(() => undefined);
}

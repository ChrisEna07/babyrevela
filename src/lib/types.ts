export type Team = "boy" | "girl";

export type Phase = "idle" | "voting" | "countdown" | "revealed";

export interface AppState {
  votingOpen: boolean;
  phase: Phase;
  countdownEndsAt: number | null;
  countdownDuration: number;
  revealChoice: Team | null;
}

export interface Vote {
  name: string;
  team: Team;
  updatedAt: number;
}

export interface VoteMap {
  [guestId: string]: Vote;
}

export interface VoteLogEntry {
  name: string;
  team: Team;
  at: number;
}

export interface SuperAdminInfo {
  name: string;
  pinHash: string;
}

export interface RevealerInfo {
  name: string | null;
  pinHash: string | null;
}

export interface VoteTotals {
  boy: number;
  girl: number;
  total: number;
  boyPercent: number;
  girlPercent: number;
}

export interface StoredGuest {
  id: string;
  name: string;
}

export interface HistoricalSession {
  id: string;
  createdAt: number;
  dateStr: string;
  revealChoice: Team | null;
  totals: VoteTotals;
  votes: Vote[];
}

export interface RSVP {
  id: string;
  name: string;
  attending: boolean;
  guestsCount: number;
  mode?: "presencial" | "remota";
  message?: string;
  likes?: number;
  createdAt: number;
}

export interface RSVPMap {
  [id: string]: RSVP;
}

export interface HostConfig {
  name: string;
  pinHash: string;
  setupToken?: string;
  updatedAt?: number;
}

export interface EventSchedule {
  eventDate?: string;
  eventTime?: string;
  revealTime?: string;
  updatedAt?: number;
}

export interface EventCancellation {
  status: "aplazado" | "cancelado" | "activo";
  reason: string;
  updatedAt?: number;
}

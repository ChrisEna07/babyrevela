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

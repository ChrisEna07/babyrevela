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

export interface RSVPComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface RSVP {
  id: string;
  name: string;
  attending: boolean;
  guestsCount: number;
  mode?: "presencial" | "remota";
  message?: string;
  relationship?: string;
  prediction?: Team;
  videoUrl?: string;
  likes?: number;
  comments?: Record<string, RSVPComment>;
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

export interface EventLocation {
  address: string;
  reference: string;
  photoUrl: string;
  googleMapsUrl?: string;
  wazeUrl?: string;
  appleMapsUrl?: string;
  updatedAt?: number;
}

export interface TenantInvite {
  id: string;
  token: string;
  used: boolean;
  createdBy: string;
  createdAt: number;
  usedAt?: number;
  tenantId?: string;
}

export interface TenantEvent {
  tenantId: string;
  eventName: string;
  parentsNames: string;
  ownerName: string;
  createdAt: number;
  active: boolean;
}

export interface MasterAnalytics {
  totalEvents: number;
  activeTenantsCount: number;
  totalRSVPs: number;
  totalVotes: number;
  singleUseInvitesCount: number;
}

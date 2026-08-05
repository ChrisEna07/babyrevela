import type { Team } from "./types";

export const EVENT_NAME = "Baby Revela";
export const EVENT_TAGLINE = "¿Será niño o niña?";

export const GUEST_KEY = "babyrevela.guest.v1";
export const ADMIN_KEY = "babyrevela.admin.v1";
export const SUPER_ADMIN_KEY = "babyrevela.superadmin.v1";

export const COUNTDOWN_OPTIONS = [5, 10, 15, 30];
export const DEFAULT_COUNTDOWN = 10;

export const PALETTE: Record<Team, string[]> = {
  boy: ["#a6d8f0", "#6fb3dd", "#d8eefb", "#e9c46a", "#ffffff"],
  girl: ["#ffd1e0", "#f5a3c3", "#ffeaf2", "#e9c46a", "#ffffff"],
};

export const TEAM_CONFIG: Record<
  Team,
  { label: string; shortLabel: string; emoji: string; verb: string }
> = {
  boy: {
    label: "¡Es un NIÑO!",
    shortLabel: "Niño",
    emoji: "👶",
    verb: "azul",
  },
  girl: {
    label: "¡Es una NIÑA!",
    shortLabel: "Niña",
    emoji: "👶",
    verb: "rosa",
  },
};

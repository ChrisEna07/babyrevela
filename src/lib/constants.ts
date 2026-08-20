import type { Team } from "./types";

export const EVENT_NAME = "Baby Revela";
export const EVENT_TAGLINE = "¿Será niño o niña?";
export const APP_DOMAIN = "https://babyrevela.vercel.app";

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

export const BABY_THOUGHTS = [
  "Espero que al nacer mi papá me compre un biberón blandito... 🍼",
  "Si le cuento a mamá que el bebé de al lado me parece lindo, ¿será muy precoz o crezco primero? 🤭",
  "Oigan, aquí adentro hace calorcito, pero ya quiero probar el pastel de la fiesta 🍰",
  "Tengo una duda existencial... ¿mis papás ya eligieron mi nombre o van a improvisar el día del parto? 🧐",
  "Prometo no llorar a las 3:00 AM... mentira, sí voy a llorar a las 3:00 AM 😈👶",
  "Siento muchas pataditas por aquí... ¡es que estoy practicando para ser futbolista o bailarina! ⚽🩰",
  "¿Quién votó por niño? ¿Y quién por niña? Espero que hayan apostado regalitos bonitos 🎁✨",
  "Por si acaso, desde ya les aviso que me parezco 99% a mi mamá y 1% a mi papá 😜",
  "Mamá, si sientes que me muevo mucho es porque estoy bailando la música de los tíos 🎶💃",
  "Papis, recuerden: la ropa de bebé sin etiquetas rasposas, por favor 🧸",
  "Escucho muchas risas allá afuera... ¡ya quiero salir a conocer a mis tíos consentidores! 🥰",
  "Doctor, por favor tome mi mejor ángulo en el próximo ultrasonido 📸👶",
  "Si soy niño seré un galán, si soy niña seré una reina... ¡de cualquier forma seré el consentido! 👑💙💗",
  "¡Oigan! ¿Ya falta mucho para la cuenta regresiva? ¡La emoción me da hipo acá adentro! 🤭⏱️",
  "Mi pasatiempo favorito en la panza: chuparme el dedo y patear la vejiga de mamá 🍼💥",
];

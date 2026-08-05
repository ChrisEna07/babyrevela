import confetti from "canvas-confetti";
import type { Team } from "./types";
import { PALETTE } from "./constants";

let heartShape: confetti.Shape | null = null;

function getHeartShape(): confetti.Shape | null {
  if (heartShape) return heartShape;
  try {
    if (typeof confetti.shapeFromText === "function") {
      heartShape = confetti.shapeFromText({ text: "💛", scalar: 2 });
    }
  } catch {
    heartShape = null;
  }
  return heartShape;
}

function burst(opts: confetti.Options) {
  confetti({
    disableForReducedMotion: true,
    ...opts,
  });
}

export function fireVoteConfetti(team: Team) {
  burst({
    particleCount: 40,
    spread: 70,
    origin: { x: team === "boy" ? 0.2 : 0.8, y: 0.7 },
    colors: PALETTE[team],
    scalar: 1,
  });
}

export function fireRevealConfetti(team: Team) {
  const colors = PALETTE[team];
  const shapes: confetti.Shape[] = getHeartShape()
    ? [getHeartShape()!, "circle", "square"]
    : ["circle", "square"];

  const base = {
    colors,
    shapes,
    disableForReducedMotion: true,
  } satisfies confetti.Options;

  burst({ ...base, particleCount: 90, angle: 60, spread: 65, origin: { x: 0, y: 0.65 } });
  burst({ ...base, particleCount: 90, angle: 120, spread: 65, origin: { x: 1, y: 0.65 } });
  burst({ ...base, particleCount: 60, angle: 90, spread: 90, origin: { x: 0.5, y: 0.45 }, scalar: 1.2 });

  const duration = 3500;
  const end = Date.now() + duration;
  const interval = window.setInterval(() => {
    if (Date.now() > end) {
      window.clearInterval(interval);
      return;
    }
    burst({
      ...base,
      particleCount: 45,
      spread: 100,
      startVelocity: 38,
      origin: { x: 0.15 + Math.random() * 0.7, y: 0.25 + Math.random() * 0.4 },
    });
  }, 320);

  window.setTimeout(() => window.clearInterval(interval), duration);
}

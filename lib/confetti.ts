import confetti from "canvas-confetti";

export function burstExactScore(origin?: { x: number; y: number }) {
  const defaults = {
    spread: 60,
    ticks: 80,
    gravity: 1.1,
    decay: 0.92,
    startVelocity: 28,
    colors: ["#22c55e", "#4ade80", "#fbbf24", "#ffffff"],
  };

  confetti({
    ...defaults,
    particleCount: 40,
    origin: origin ?? { x: 0.5, y: 0.55 },
  });
}

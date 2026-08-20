"use client";

import { motion } from "framer-motion";

const SILHOUETTES = [
  { icon: "👶", left: "5%", duration: 18, delay: 0 },
  { icon: "🍼", left: "18%", duration: 22, delay: 3 },
  { icon: "🧸", left: "32%", duration: 20, delay: 6 },
  { icon: "🎈", left: "48%", duration: 19, delay: 2 },
  { icon: "🎀", left: "62%", duration: 24, delay: 8 },
  { icon: "👶", left: "75%", duration: 21, delay: 4 },
  { icon: "🍼", left: "88%", duration: 23, delay: 7 },
  { icon: "🧸", left: "93%", duration: 25, delay: 1 },
];

export function FloatingBabySilhouettes() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30 select-none">
      {SILHOUETTES.map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-3xl sm:text-4xl filter drop-shadow-sm"
          style={{ left: item.left, bottom: "-10%" }}
          animate={{
            y: ["0vh", "-120vh"],
            x: [0, (index % 2 === 0 ? 30 : -30), 0],
            rotate: [0, index % 2 === 0 ? 360 : -360],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: "linear",
            delay: item.delay,
          }}
        >
          {item.icon}
        </motion.div>
      ))}
    </div>
  );
}

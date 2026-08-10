import React from "react";
import { motion } from "framer-motion";

const COLORS = ["#e7c368", "#7fd9a6", "#f0906a", "#f4f0e4"];

// A short, tasteful burst — not a full-screen effect, just enough
// to acknowledge "money actually moved."
export default function Confetti() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);

  return (
    <>
      {pieces.map((i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const distance = 80 + Math.random() * 60;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        return (
          <motion.div
            key={i}
            className="confetti-piece"
            style={{ background: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.4, rotate: 180 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        );
      })}
    </>
  );
}

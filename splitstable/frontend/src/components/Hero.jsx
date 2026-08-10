import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Receipt, Sparkles, Send } from "lucide-react";

// Node positions for the four "friends" in the diagram
const NODES = [
  { id: "A", x: 60, y: 40, label: "A" },
  { id: "B", x: 300, y: 40, label: "B" },
  { id: "C", x: 60, y: 180, label: "C" },
  { id: "D", x: 300, y: 180, label: "D" },
];

// The messy, real-life version: everyone owes a bit of everyone
const TANGLED_EDGES = [
  ["A", "B"],
  ["B", "C"],
  ["C", "A"],
  ["D", "A"],
  ["B", "D"],
  ["C", "D"],
];

// What SplitStable actually asks people to pay — minimum transfers
const SIMPLIFIED_EDGES = [
  ["C", "B"],
  ["D", "A"],
];

function pos(id) {
  const n = NODES.find((n) => n.id === id);
  return { x: n.x, y: n.y };
}

export default function Hero() {
  const [simplified, setSimplified] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setSimplified((s) => !s), 2600);
    return () => clearInterval(interval);
  }, []);

  const edges = simplified ? SIMPLIFIED_EDGES : TANGLED_EDGES;

  return (
    <div className="hero">
      <motion.div
        className="eyebrow"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        BUILT ON ARC · SETTLES IN USDC
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Untangle who owes <em>who</em>,
        <br />
        settle it in one tap.
      </motion.h1>

      <motion.p
        className="hero-sub"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Log group expenses like any splitter. But instead of a spreadsheet of
        who-owes-who, SplitStable collapses every debt into the fewest possible
        payments — and sends real USDC the moment someone taps "pay."
      </motion.p>

      <motion.div
        className="diagram-wrap"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <svg viewBox="0 0 360 220" className="diagram">
          <AnimatePresence mode="popLayout">
            {edges.map(([from, to]) => {
              const p1 = pos(from);
              const p2 = pos(to);
              return (
                <motion.line
                  key={`${simplified}-${from}-${to}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={simplified ? "var(--positive)" : "var(--negative)"}
                  strokeWidth={simplified ? 2.5 : 1.5}
                  strokeLinecap="round"
                  markerEnd="url(#arrow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: simplified ? 0.9 : 0.45 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              );
            })}
          </AnimatePresence>

          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="var(--text-faint)" />
            </marker>
          </defs>

          {NODES.map((n) => (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r="18" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="1.5" />
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fill="var(--text-primary)">
                {n.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="diagram-caption">
          {simplified ? "2 payments settle everyone" : "6 tangled IOUs between 4 friends"}
        </div>
      </motion.div>

      <div className="how-it-works">
        {[
          { icon: Wallet, title: "Connect", body: "Link your wallet — Arc testnet is added automatically." },
          { icon: Receipt, title: "Log expenses", body: "Add what was spent and who it's split between." },
          { icon: Sparkles, title: "Simplify", body: "We net every balance down to the fewest transfers." },
          { icon: Send, title: "Settle", body: "One tap sends real USDC, confirmed in seconds." },
        ].map((s, i) => (
          <motion.div
            className="how-step"
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <span className="how-step-num">0{i + 1}</span>
            <s.icon size={16} color="var(--accent)" style={{ marginBottom: 6 }} />
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

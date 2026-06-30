"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

/** Lightweight DOM confetti in the album's accent colors. Respects reduced-motion. */
export default function Confetti({ colors }: { colors: string[] }) {
  const [visible, setVisible] = useState(true);
  const pieces = useMemo(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return [];
    }
    const palette = colors.length ? colors : ["#8a38f5", "#d53a6b", "#ffd23f"];
    return Array.from({ length: 150 }, (_, i) => ({
      id: i,
      left: Math.round(((i * 37) % 100) + (i % 5)),
      delay: (i % 16) * 0.06,
      duration: 2 + (i % 8) * 0.24,
      color: palette[i % palette.length],
      rotate: (i * 47) % 360,
      spin: 360 + ((i * 53) % 540) * (i % 2 ? 1 : -1),
      drift: ((i * 29) % 80) - 40,
      size: 7 + (i % 4) * 2,
      round: i % 4 === 0,
    }));
  }, [colors]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4600);
    return () => clearTimeout(t);
  }, []);

  if (!visible || !pieces.length) return null;

  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`confetti__piece${p.round ? " confetti__piece--round" : ""}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.4,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--r" as string]: `${p.rotate}deg`,
            ["--spin" as string]: `${p.spin}deg`,
            ["--drift" as string]: `${p.drift}px`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

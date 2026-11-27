"use client";

import { useEffect, useState } from "react";

const FLAKES = ["❄", "❅", "❆", "✦", "•"];

type Flake = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  char: string;
  drift: number;
};

export function Snow({ count }: { count?: number }) {
  const [flakes, setFlakes] = useState<Flake[]>([]);

  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const n = count ?? (isMobile ? 28 : 48);
    const generated: Flake[] = Array.from({ length: n }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * -12,
      duration: 8 + Math.random() * 14,
      size: isMobile ? 0.7 + Math.random() * 0.9 : 0.65 + Math.random() * 1.2,
      char: FLAKES[Math.floor(Math.random() * FLAKES.length)],
      drift: -20 + Math.random() * 40,
    }));
    setFlakes(generated);
  }, [count]);

  if (flakes.length === 0) return null;

  return (
    <div className="snow-container" aria-hidden>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="snowflake"
          style={{
            left: `${f.left}%`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
            fontSize: `${f.size}rem`,
            // slight horizontal drift via CSS variable
            ["--drift" as string]: `${f.drift}px`,
          }}
        >
          {f.char}
        </span>
      ))}
    </div>
  );
}

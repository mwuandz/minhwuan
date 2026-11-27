"use client";

import { useEffect, useState } from "react";

const FLAKES = ["❄", "❅", "❆", "•"];

export function Snow({ count = 40 }: { count?: number }) {
  const [flakes, setFlakes] = useState<
    { id: number; left: number; delay: number; duration: number; size: number; char: string }[]
  >([]);

  useEffect(() => {
    const generated = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 10 + Math.random() * 15,
      size: 0.6 + Math.random() * 1.1,
      char: FLAKES[Math.floor(Math.random() * FLAKES.length)],
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
          }}
        >
          {f.char}
        </span>
      ))}
    </div>
  );
}

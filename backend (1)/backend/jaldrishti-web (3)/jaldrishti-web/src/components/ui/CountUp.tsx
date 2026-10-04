"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

/**
 * Animates a figure to its new value. Motion answers a change the user caused
 * (selecting a ward, moving a weight), so it shows what changed rather than
 * decorating the load.
 */
export function CountUp({
  value,
  format = (n) => n.toFixed(0),
  duration = 520,
  className = "",
}: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const from = fromRef.current;
    const to = value;
    if (reduce || from === to) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutQuint: fast settle, no bounce
      const eased = 1 - Math.pow(1 - t, 5);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  return <span className={`figure ${className}`}>{format(display)}</span>;
}

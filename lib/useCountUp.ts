"use client";
import { useState, useEffect, useRef } from "react";

/**
 * Smooth animated count-up hook (easeOutExpo).
 * Returns the current animated value — use `Math.round()` for display.
 */
export function useCountUp(
  target: number,
  { duration = 900, delay = 0 }: { duration?: number; delay?: number } = {}
): number {
  const [v, setV] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const from = fromRef.current;
    const to = target;
    const t0 = performance.now() + delay;

    const tick = (now: number) => {
      if (now < t0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - t0) / duration);
      // easeOutExpo
      const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const cur = from + (to - from) * e;
      setV(cur);
      fromRef.current = cur;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, delay]);

  return v;
}

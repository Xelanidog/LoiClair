'use client';
import { useEffect, useRef } from 'react';

// Anime le background-position via JS pour contourner le bug Safari
// (Safari n'anime pas background-position sur les éléments avec background-clip:text)
export default function ShimmerText({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t0 = performance.now();
    let id: number;
    const run = (t: number) => {
      const x = 200 - ((t - t0) % 2500) / 2500 * 400;
      el.style.backgroundPosition = `${x}% center`;
      id = requestAnimationFrame(run);
    };
    id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <span
      ref={ref}
      style={{
        background: 'linear-gradient(90deg,#0891B2 20%,#22D3EE 50%,#0891B2 80%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}

import { useEffect, useRef } from 'react';

const BAR_COUNT = 36;
// Pre-generate stable random parameters so bars don't change on re-render
const BAR_PHASES = Array.from({ length: BAR_COUNT }, () => Math.random() * Math.PI * 2);
const BAR_SPEEDS = Array.from({ length: BAR_COUNT }, () => 0.025 + Math.random() * 0.04);
const BAR_BASE   = Array.from({ length: BAR_COUNT }, () => 0.1 + Math.random() * 0.2);

export function AudioVisualizer({
  active,
  color,
  reduced = false,
  type = 'bar',
}: {
  active: boolean;
  color: string;
  reduced?: boolean;
  type?: 'bar' | 'sine';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let rafId = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (!w || !h) { rafId = requestAnimationFrame(draw); return; }

      const cw = Math.round(w * dpr);
      const ch = Math.round(h * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (type === 'sine') {
        // --- Winamp Sinusoidal Mode ---
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.shadowBlur = active ? 6 : 0;
        ctx.shadowColor = color;
        ctx.globalAlpha = active ? 0.95 : 0.25;

        ctx.beginPath();
        const midY = h / 2;
        const amplitude = active ? h * 0.45 : 3;

        for (let x = 0; x < w; x++) {
          const t = x * 0.05 - frame * 0.12;
          const y = midY + Math.sin(t) * Math.cos(x * 0.01 + frame * 0.02) * amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
      } else {
        // --- Spotify Spectrum Bar Mode ---
        const gap  = 2;
        const barW = Math.max(2, (w - (BAR_COUNT - 1) * gap) / BAR_COUNT);

        for (let i = 0; i < BAR_COUNT; i++) {
          const t    = frame * BAR_SPEEDS[i] + BAR_PHASES[i];
          const wave = Math.abs(Math.sin(t)) *
            (0.48 + Math.sin(frame * 0.008 + i * 0.28) * 0.26);
          const energy = active
            ? Math.max(0.07, BAR_BASE[i] + wave * 0.7)
            : Math.max(0.04, BAR_BASE[i] * 0.2 + Math.sin(t * 0.25) * 0.03);

          const barH = Math.max(2, energy * h);
          const x    = i * (barW + gap);
          const y    = h - barH;

          // Gradient: accent color at top → transparent at bottom
          const grad = ctx.createLinearGradient(x, y, x, h);
          grad.addColorStop(0,   color);
          grad.addColorStop(0.6, `${color}88`);
          grad.addColorStop(1,   `${color}18`);

          ctx.globalAlpha = active ? 0.88 : 0.24;
          ctx.fillStyle   = grad;
          ctx.beginPath();
          ctx.rect(x, y, barW, barH);
          ctx.fill();

          // White peak dot on tall bars (every other bar, not in reduced mode)
          if (active && !reduced && energy > 0.5 && i % 2 === 0) {
            ctx.globalAlpha = Math.min(0.92, (energy - 0.5) * 2.6);
            ctx.fillStyle   = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + barW / 2, y + 1.2, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      frame += reduced ? 0.35 : 1;
      if (!document.hidden) rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [active, color, reduced, type]);

  return (
    <canvas
      className={`audio-visualizer type-${type}`}
      ref={canvasRef}
      aria-label="Visualizador de espectro de audio"
      aria-hidden="true"
    />
  );
}

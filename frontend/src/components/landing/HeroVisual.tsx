import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Volume2 } from 'lucide-react';

export const HeroVisual: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);

      const bars = 42;
      const gap = 4;
      const barWidth = Math.max(3, (width - gap * (bars - 1)) / bars);
      for (let i = 0; i < bars; i += 1) {
        const wave = Math.sin(frame * 0.045 + i * 0.38);
        const wave2 = Math.cos(frame * 0.03 + i * 0.17);
        const amount = reduced ? 0.45 : Math.abs(wave * 0.62 + wave2 * 0.38);
        const barHeight = 18 + amount * (height * 0.72);
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, 'rgba(103, 232, 249, 0.95)');
        gradient.addColorStop(0.55, 'rgba(99, 102, 241, 0.85)');
        gradient.addColorStop(1, 'rgba(167, 139, 250, 0.35)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 8);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.85)';
      for (let x = 0; x <= width; x += 4) {
        const y =
          height / 2 +
          Math.sin(x * 0.02 + frame * 0.05) * (reduced ? 8 : 22) +
          Math.sin(x * 0.008 + frame * 0.02) * (reduced ? 4 : 10);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      frame += 1;
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative animate-float">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-indigo-500/30 via-cyan-400/20 to-purple-500/20 blur-2xl animate-drift pointer-events-none" />
      <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-950/80 shadow-2xl shadow-indigo-950/50">
        <img
          src="/images/voxai_soundwave_hero_1792906989489.jpg"
          alt="VoxAI acoustic visualization"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <canvas ref={canvasRef} className="relative z-10 h-72 w-full sm:h-80" />
        <div className="absolute bottom-4 left-4 right-4 z-20 p-4 rounded-xl bg-slate-950/85 border border-slate-800/90 backdrop-blur-md flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white">
              <span className="absolute inset-0 rounded-lg animate-ping bg-cyan-400/30" />
              <Volume2 className="relative h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Live Voice Pipeline</p>
              <p className="text-[11px] text-slate-400">Listening · Thinking · Speaking</p>
            </div>
          </div>
          <Link
            to="/register"
            className="rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-indigo-600/40 transition-colors"
          >
            Try Now
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute -left-3 top-8 flex h-16 items-end gap-1 rounded-2xl border border-cyan-400/20 bg-slate-950/70 px-3 py-3 backdrop-blur animate-float-delayed">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className="eq-bar w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-300"
            style={{ animationDelay: `${bar * 0.12}s`, height: '100%' }}
          />
        ))}
      </div>
    </div>
  );
};

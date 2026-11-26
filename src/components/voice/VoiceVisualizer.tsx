import React, { useEffect, useRef } from 'react';
import { VoiceState } from '../../types';
import { Mic, MicOff, Square, Sparkles, Volume2, AlertCircle, Loader2 } from 'lucide-react';

interface VoiceVisualizerProps {
  state: VoiceState;
  audioLevel: number;
  frequencies: number[];
  recordingSeconds: number;
  onToggleRecording: () => void;
  disabled?: boolean;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  state,
  audioLevel,
  frequencies,
  recordingSeconds,
  onToggleRecording,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Canvas Waveform Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isActive = state === 'listening' || state === 'recording' || state === 'speaking';
      const isThinking = state === 'thinking';

      const barCount = 48;
      const barWidth = 3;
      const spacing = (width - barCount * barWidth) / (barCount - 1);

      // Render symmetric animated frequency bars
      for (let i = 0; i < barCount; i++) {
        // Map bar index to frequency array symmetrically
        const half = barCount / 2;
        const distFromCenter = Math.abs(i - half) / half;
        const freqIndex = Math.min(
          frequencies.length - 1,
          Math.floor((1 - distFromCenter * 0.7) * (frequencies.length - 1))
        );

        let intensity = frequencies[freqIndex] || 0.05;

        if (isThinking) {
          // Sine wave phase during thinking
          const time = Date.now() / 250;
          intensity = 0.2 + 0.35 * Math.sin(time + i * 0.25);
        } else if (!isActive) {
          // Gentle ambient breath
          const time = Date.now() / 800;
          intensity = 0.08 + 0.05 * Math.sin(time + i * 0.2);
        }

        const barHeight = Math.max(4, intensity * (height * 0.85));
        const x = i * (barWidth + spacing);
        const y = (height - barHeight) / 2;

        // Gradient from cyan to indigo
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (state === 'recording' || state === 'listening') {
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(1, '#818cf8');
        } else if (state === 'speaking') {
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(1, '#6366f1');
        } else if (state === 'thinking') {
          gradient.addColorStop(0, '#ec4899');
          gradient.addColorStop(1, '#8b5cf6');
        } else {
          const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
          gradient.addColorStop(0, isLight ? '#94a3b8' : '#475569');
          gradient.addColorStop(1, isLight ? '#cbd5e1' : '#334155');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, frequencies]);

  // Dynamic scale calculation based on real audio level
  const dynamicScale = Math.min(1.35, 1 + audioLevel * 0.9);

  return (
    <div className="relative flex flex-col items-center justify-center py-6 px-4">
      {/* Outer Glow Halo */}
      <div
        className={`absolute h-72 w-72 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          state === 'recording' || state === 'listening'
            ? 'bg-cyan-500/20 scale-125'
            : state === 'speaking'
            ? 'bg-indigo-500/25 scale-125'
            : state === 'thinking'
            ? 'bg-purple-500/25 scale-110'
            : 'bg-indigo-950/20 scale-90'
        }`}
      />

      {/* Interactive Visualizer Sphere Container */}
      <div className="relative flex items-center justify-center h-64 w-64">
        {/* Animated Ripple Rings while recording or speaking */}
        {(state === 'recording' || state === 'listening' || state === 'speaking') && (
          <>
            <div
              className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping"
              style={{ animationDuration: '2.5s' }}
            />
            <div
              className="absolute -inset-4 rounded-full border border-indigo-500/20 animate-pulse"
              style={{ animationDuration: '1.8s' }}
            />
          </>
        )}

        {/* Orbit Ring */}
        <div
          className={`absolute inset-2 rounded-full border transition-all duration-500 ${
            state === 'recording'
              ? 'border-cyan-500/40 shadow-[0_0_25px_rgba(56,189,248,0.25)]'
              : state === 'speaking'
              ? 'border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.25)]'
              : state === 'thinking'
              ? 'border-purple-500/40 animate-spin'
              : 'border-slate-800'
          }`}
          style={{
            transform: `scale(${dynamicScale})`,
            transition: 'transform 0.08s ease-out',
          }}
        />

        {/* Central Visual Orb Button */}
        <button
          onClick={onToggleRecording}
          disabled={disabled || state === 'transcribing' || state === 'thinking'}
          className={`relative z-10 flex h-36 w-36 items-center justify-center rounded-full shadow-2xl transition-all duration-300 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/50 ${
            state === 'recording' || state === 'listening'
              ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-cyan-500/40'
              : state === 'speaking'
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-500/30'
              : state === 'thinking'
              ? 'bg-gradient-to-tr from-purple-800 to-indigo-900 text-purple-200 cursor-wait'
              : 'bg-slate-900 light:bg-white border border-slate-700/80 light:border-slate-300 text-slate-200 light:text-slate-800 hover:border-indigo-500/60 light:hover:border-indigo-400 hover:text-white light:hover:text-indigo-600 shadow-xl shadow-black/40 light:shadow-indigo-500/10'
          }`}
          style={{
            transform: `scale(${dynamicScale})`,
            transition: 'transform 0.08s ease-out, background 0.3s ease',
          }}
          aria-label={
            state === 'recording' || state === 'listening'
              ? 'Stop recording voice'
              : 'Start recording voice'
          }
        >
          {state === 'recording' || state === 'listening' ? (
            <Square className="h-10 w-10 fill-current animate-pulse" />
          ) : state === 'thinking' ? (
            <Sparkles className="h-10 w-10 animate-spin text-purple-300" />
          ) : state === 'transcribing' ? (
            <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
          ) : state === 'speaking' ? (
            <Volume2 className="h-10 w-10 animate-pulse text-white" />
          ) : (
            <Mic className="h-11 w-11 transition-transform group-hover:scale-110 text-indigo-400 light:text-indigo-600" />
          )}
        </button>
      </div>

      {/* Waveform Frequency Canvas */}
      <div className="w-full max-w-md h-12 mt-2 px-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={48}
          className="w-full h-full block"
        />
      </div>

      {/* Status Label & Duration Timer */}
      <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-2">
          {state === 'recording' && (
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          )}
          <span className="text-sm font-semibold tracking-wide text-slate-200 light:text-slate-900">
            {state === 'idle' && 'Tap the microphone to speak'}
            {state === 'requesting_permission' && 'Accessing microphone...'}
            {state === 'listening' && 'Listening to your voice...'}
            {state === 'recording' && `Recording Speech · ${formatTime(recordingSeconds)}`}
            {state === 'transcribing' && 'Transcribing voice audio...'}
            {state === 'thinking' && 'VoxAI is formulating response...'}
            {state === 'speaking' && 'VoxAI is speaking...'}
            {state === 'paused' && 'Audio paused'}
            {state === 'error' && 'Interaction error'}
          </span>
        </div>

        <p className="text-xs text-slate-400 light:text-slate-600 max-w-sm">
          {state === 'recording' && 'Speak clearly into your microphone. Tap the button when finished.'}
          {state === 'idle' && 'Powered by low-latency Speech-to-Text and expressive Voice Synthesis.'}
          {state === 'speaking' && 'Audio output actively playing. You can interrupt or ask another question.'}
          {state === 'thinking' && 'Synthesizing contextual reasoning and preparing natural speech.'}
        </p>
      </div>
    </div>
  );
};

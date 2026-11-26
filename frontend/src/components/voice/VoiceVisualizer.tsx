import React, { useEffect, useRef } from 'react';
import { AlertCircle, Loader2, Mic, Square, Volume2 } from 'lucide-react';
import { VoiceState } from '../../types';

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

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue('--accent').trim() || '#e08a4f';
      const mute = styles.getPropertyValue('--mute').trim() || '#a79e93';

      const isActive = state === 'listening' || state === 'recording' || state === 'speaking';
      const isThinking = state === 'thinking';
      const barCount = 36;
      const barWidth = 4;
      const spacing = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const half = barCount / 2;
        const distFromCenter = Math.abs(i - half) / half;
        const freqIndex = Math.min(
          Math.max(frequencies.length - 1, 0),
          Math.floor((1 - distFromCenter * 0.7) * Math.max(frequencies.length - 1, 0))
        );

        let intensity = frequencies[freqIndex] || 0.05;
        if (isThinking) {
          intensity = 0.22 + 0.28 * Math.sin(Date.now() / 280 + i * 0.28);
        } else if (!isActive) {
          intensity = 0.08 + 0.04 * Math.sin(Date.now() / 900 + i * 0.22);
        }

        const barHeight = Math.max(4, intensity * (height * 0.86));
        const x = i * (barWidth + spacing);
        const y = (height - barHeight) / 2;
        ctx.fillStyle = isActive || isThinking ? accent : mute;
        ctx.globalAlpha = isActive || isThinking ? 0.9 : 0.45;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [state, frequencies]);

  const live = state === 'recording' || state === 'listening' || state === 'speaking';
  const scale = Math.min(1.08, 1 + audioLevel * 0.18);
  const busy = disabled || state === 'transcribing' || state === 'thinking';

  return (
    <div className="flex flex-col items-center px-4 py-4">
      <div className="relative flex h-56 w-56 items-center justify-center">
        {live && <span className="listen-ring absolute inset-6 rounded-full border border-accent/50" />}
        <button
          type="button"
          onClick={onToggleRecording}
          disabled={busy}
          className={`relative z-10 flex h-32 w-32 items-center justify-center rounded-full transition-colors ${
            live
              ? 'bg-accent text-accent-ink'
              : 'border border-line bg-panel text-ink hover:border-accent'
          } ${busy ? 'cursor-wait opacity-80' : ''}`}
          style={{ transform: `scale(${scale})` }}
          aria-label={live ? 'Stop recording' : 'Start recording'}
        >
          {state === 'recording' || state === 'listening' ? (
            <Square className="h-8 w-8 fill-current" strokeWidth={1.75} />
          ) : state === 'thinking' || state === 'transcribing' ? (
            <Loader2 className="h-8 w-8 animate-spin" strokeWidth={1.75} />
          ) : state === 'speaking' ? (
            <Volume2 className="h-8 w-8" strokeWidth={1.75} />
          ) : state === 'error' ? (
            <AlertCircle className="h-8 w-8 text-danger" strokeWidth={1.75} />
          ) : (
            <Mic className="h-9 w-9" strokeWidth={1.75} />
          )}
        </button>
      </div>

      <canvas ref={canvasRef} width={420} height={56} className="mt-1 h-12 w-full max-w-md" />

      <div className="mt-3 text-center">
        <p className="text-base font-semibold">
          {state === 'idle' && 'Tap the mic and talk'}
          {state === 'requesting_permission' && 'Asking for the microphone'}
          {state === 'listening' && 'Listening'}
          {state === 'recording' && `Listening · ${formatTime(recordingSeconds)}`}
          {state === 'transcribing' && 'Writing down what you said'}
          {state === 'thinking' && 'Working on a reply'}
          {state === 'speaking' && 'Speaking'}
          {state === 'paused' && 'Paused'}
          {state === 'error' && 'Something went wrong'}
        </p>
        <p className="mt-1 max-w-sm text-sm text-mute">
          {state === 'recording' && 'Tap again when you are finished.'}
          {state === 'idle' && 'You can also type a message underneath.'}
          {state === 'speaking' && 'You can stop the voice and ask something else.'}
          {state === 'thinking' && 'This usually takes a moment.'}
        </p>
      </div>
    </div>
  );
};

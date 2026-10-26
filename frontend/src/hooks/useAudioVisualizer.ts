import { useEffect, useRef, useState, useCallback } from 'react';

export function useAudioVisualizer() {
  const [frequencies, setFrequencies] = useState<number[]>(new Array(32).fill(0.05));
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startVisualizing = useCallback((stream: MediaStream) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // returns 32 frequency bins
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateData = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Normalize data to 0..1
        let sum = 0;
        const normalized = Array.from(dataArray).map((val) => {
          sum += val;
          return Math.max(0.04, val / 255);
        });

        const avg = sum / dataArray.length / 255;
        setAudioLevel(avg);
        setFrequencies(normalized);

        animationFrameRef.current = requestAnimationFrame(updateData);
      };

      updateData();
    } catch (err) {
      console.warn('Audio visualizer initialization error:', err);
    }
  }, []);

  const stopVisualizing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setFrequencies(new Array(32).fill(0.05));
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      stopVisualizing();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stopVisualizing]);

  return {
    frequencies,
    audioLevel,
    startVisualizing,
    stopVisualizing,
  };
}

import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceRecorderProps {
  language?: string;
  onVisualStream?: (stream: MediaStream) => void;
  onInterimTranscript?: (text: string) => void;
}

export function useVoiceRecorder({ language = 'en-US', onVisualStream, onInterimTranscript }: VoiceRecorderProps = {}) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const speechRecognizerRef = useRef<any>(null);

  // Initialize SpeechRecognition if browser supports it for instant live visual transcription
  const startSpeechRecognition = useCallback(() => {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language || 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (onInterimTranscript && transcript.trim()) {
          onInterimTranscript(transcript.trim());
        }
      };

      recognition.onerror = () => {
        // quiet fallback
      };

      recognition.start();
      speechRecognizerRef.current = recognition;
    } catch {
      // SpeechRecognition fallback optional
    }
  }, [language, onInterimTranscript]);

  const stopSpeechRecognition = useCallback(() => {
    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch {}
      speechRecognizerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setPermissionError(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording APIs.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      if (onVisualStream) {
        onVisualStream(stream);
      }

      // Check supported mime types
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100); // 100ms slice for timely data buffer
      setIsRecording(true);

      // Start duration timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Start live transcription assistant
      startSpeechRecognition();
      return true;
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      let errorMsg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No microphone device found on your system.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Microphone is already in use by another application.';
      }
      setPermissionError(errorMsg);
      setIsRecording(false);
      return false;
    }
  }, [onVisualStream, startSpeechRecognition]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      stopSpeechRecognition();

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false);
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        // Clean up tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);
        resolve(audioBlob);
      };

      recorder.stop();
    });
  }, [stopSpeechRecognition]);

  const cancelRecording = useCallback(() => {
    stopSpeechRecognition();
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  }, [stopSpeechRecognition]);

  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  return {
    isRecording,
    recordingSeconds,
    permissionError,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError: () => setPermissionError(null),
  };
}

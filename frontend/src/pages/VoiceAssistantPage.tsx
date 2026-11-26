import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { VoiceVisualizer } from '../components/voice/VoiceVisualizer';
import { TranscriptPanel } from '../components/voice/TranscriptPanel';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { voiceApi, conversationsApi } from '../services/api';
import { Message, VoiceState } from '../types';
import { SUPPORTED_LANGUAGES, VOICE_PERSONAS } from '../utils/constants';
import {
  Menu,
  Plus,
  Send,
  Volume2,
  VolumeX,
  AlertCircle,
  Maximize2,
  Minimize2,
  AudioLines,
  Square,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';

export const VoiceAssistantPage: React.FC = () => {
  const { settings, theme, toggleTheme, updateSettings } = useAuth();
  const location = useLocation();

  // Navigation & Drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Language & Voice Persona selection state
  const [selectedLanguage, setSelectedLanguage] = useState<string>(settings.language || 'en-US');
  const [selectedVoice, setSelectedVoice] = useState<string>(settings.defaultVoice || 'Kore');

  // Conversation Session State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<VoiceState>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [lastAiResponse, setLastAiResponse] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Playback & Settings State
  const [textInput, setTextInput] = useState('');
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Sync settings when loaded
  useEffect(() => {
    if (settings.language) setSelectedLanguage(settings.language);
    if (settings.defaultVoice) setSelectedVoice(settings.defaultVoice);
  }, [settings.language, settings.defaultVoice]);

  // Audio Visualizer hook
  const { frequencies, audioLevel, startVisualizing, stopVisualizing } = useAudioVisualizer();

  // Voice Recorder hook
  const {
    isRecording,
    recordingSeconds,
    permissionError,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
  } = useVoiceRecorder({
    language: selectedLanguage,
    onVisualStream: (stream) => {
      startVisualizing(stream);
    },
    onInterimTranscript: (interim) => {
      setLiveTranscript(interim);
    },
  });

  // Handle incoming conversationId or prefilled prompt from dashboard
  useEffect(() => {
    const initSession = async () => {
      const stateObj = location.state as { conversationId?: string; prefillPrompt?: string } | null;
      if (stateObj?.conversationId) {
        setConversationId(stateObj.conversationId);
        try {
          const res = await conversationsApi.get(stateObj.conversationId);
          setMessages(res.data.messages || []);
        } catch (err) {
          console.error('Failed to load conversation history:', err);
        }
      } else {
        try {
          const res = await conversationsApi.create('New Voice Session');
          setConversationId(res.data.id);
        } catch (err) {
          console.error('Session creation failed:', err);
        }
      }

      if (stateObj?.prefillPrompt) {
        setTextInput(stateObj.prefillPrompt);
      }
    };

    initSession();
  }, [location.state]);

  // Handle mic permission error
  useEffect(() => {
    if (permissionError) {
      setErrorMessage(permissionError);
      setState('error');
    }
  }, [permissionError]);

  const currentVoiceObj = VOICE_PERSONAS.find((v) => v.id === selectedVoice) || VOICE_PERSONAS[0];
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  // Handle Speech Playback helper
  const playSpeechAudio = (text: string, audioUrl?: string) => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    if (audioUrl && !isMuted) {
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audio.playbackRate = settings.playbackSpeed || 1.0;
      audioElementRef.current = audio;

      setState('speaking');
      audio.onended = () => {
        setState('idle');
        audioElementRef.current = null;
      };
      audio.onerror = () => {
        speakWithBrowserSpeech(text);
      };
      audio.play().catch(() => {
        speakWithBrowserSpeech(text);
      });
    } else {
      speakWithBrowserSpeech(text);
    }
  };

  const speakWithBrowserSpeech = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) {
      setState('idle');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.playbackSpeed || 1.0;
    utterance.pitch = currentVoiceObj.pitch || 1.15; // High/cute pitch!
    utterance.volume = volume;
    utterance.lang = selectedLanguage;

    utterance.onstart = () => setState('speaking');
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');

    window.speechSynthesis.speak(utterance);
  };

  const stopActiveSpeech = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState('idle');
  };

  // Toggle Voice Recording
  const handleToggleRecording = async () => {
    clearError();
    setErrorMessage(null);

    if (state === 'speaking') {
      stopActiveSpeech();
      return;
    }

    if (isRecording) {
      setState('transcribing');
      stopVisualizing();

      const audioBlob = await stopRecording();
      if (!audioBlob) {
        setState('idle');
        return;
      }

      await executeVoiceTurn(audioBlob, liveTranscript);
    } else {
      setState('requesting_permission');
      const started = await startRecording();
      if (started) {
        setState('recording');
        setLiveTranscript('');
      } else {
        setState('error');
      }
    }
  };

  // Execute full turn: Audio -> STT -> LLM -> TTS
  const executeVoiceTurn = async (audioBlob?: Blob, textFallback?: string) => {
    try {
      setState(audioBlob ? 'transcribing' : 'thinking');

      const res = await voiceApi.turn({
        audioBlob,
        textFallback: textFallback || undefined,
        conversationId: conversationId || undefined,
        language: selectedLanguage,
        voice: selectedVoice,
        voiceStyle: currentVoiceObj.speechStyle,
      });

      const { transcription, response, audioDataUrl, userMessage, assistantMessage } = res.data;

      setConversationId(res.data.conversationId);
      setLiveTranscript(transcription);
      setLastAiResponse(response);
      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      if (settings.autoPlaySpeech && !isMuted) {
        playSpeechAudio(response, audioDataUrl);
      } else {
        setState('idle');
      }
    } catch (err: any) {
      console.error('Turn execution error:', err);
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Voice interaction turn failed.');
      setState('error');
    }
  };

  // Text submit alternative
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || state === 'thinking' || state === 'transcribing') return;

    const query = textInput.trim();
    setTextInput('');
    setErrorMessage(null);
    setLiveTranscript(query);

    await executeVoiceTurn(undefined, query);
  };

  const handleStartNewConversation = async () => {
    stopActiveSpeech();
    cancelRecording();
    stopVisualizing();
    setMessages([]);
    setLiveTranscript('');
    setLastAiResponse('');
    setErrorMessage(null);
    setState('idle');

    try {
      const res = await conversationsApi.create('New Voice Session');
      setConversationId(res.data.id);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    updateSettings({ language: code });
  };

  const handleVoiceChange = (vId: string) => {
    setSelectedVoice(vId);
    const targetObj = VOICE_PERSONAS.find((v) => v.id === vId);
    updateSettings({
      defaultVoice: vId,
      voiceGender: targetObj?.gender || 'female',
      voiceStyle: targetObj?.speechStyle,
      voicePitch: targetObj?.pitch || 1.15,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      {/* Sidebar Navigation */}
      {!fullscreen && (
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      )}

      {/* Main Interface Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {!fullscreen && (
              <button
                onClick={() => setMobileOpen(true)}
                className="icon-btn lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              </button>
            )}

            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${state === 'idle' ? 'bg-mute' : 'bg-accent'}`} />
              <h1 className="truncate text-[15px] font-semibold">Talk</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <label className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2 py-1 text-sm">
              <Globe className="h-3.5 w-3.5 shrink-0 text-mute" strokeWidth={1.75} />
              <span className="sr-only">Language</span>
              <span aria-hidden>{currentLangObj.flag}</span>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="max-w-[7.5rem] cursor-pointer bg-transparent text-sm focus:outline-none sm:max-w-none"
                aria-label="Spoken language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-panel text-ink">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="hidden items-center gap-1.5 rounded-lg border border-line bg-panel px-2 py-1 text-sm md:flex">
              <AudioLines className="h-3.5 w-3.5 shrink-0 text-mute" strokeWidth={1.75} />
              <select
                value={selectedVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="cursor-pointer bg-transparent text-sm focus:outline-none"
                aria-label="Voice"
              >
                {VOICE_PERSONAS.map((voice) => (
                  <option key={voice.id} value={voice.id} className="bg-panel text-ink">
                    {voice.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => toggleTheme()}
              className="icon-btn"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
            </button>

            <button type="button" onClick={handleStartNewConversation} className="icon-btn" title="New conversation" aria-label="New conversation">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (state === 'speaking') stopActiveSpeech();
                setIsMuted(!isMuted);
              }}
              className={`icon-btn ${isMuted ? 'text-danger' : ''}`}
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" strokeWidth={1.75} /> : <Volume2 className="h-4 w-4" strokeWidth={1.75} />}
            </button>

            <button
              type="button"
              onClick={() => setFullscreen(!fullscreen)}
              className="icon-btn"
              title={fullscreen ? 'Exit full screen' : 'Full screen'}
              aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" strokeWidth={1.75} /> : <Maximize2 className="h-4 w-4" strokeWidth={1.75} />}
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          <div className="flex flex-col justify-between overflow-y-auto border-r border-line p-4 sm:p-6 lg:col-span-7">
            {errorMessage && (
              <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span>{errorMessage}</span>
                </div>
                <button type="button" onClick={() => setErrorMessage(null)} className="font-semibold">
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center">
              <VoiceVisualizer
                state={state}
                audioLevel={audioLevel}
                frequencies={frequencies}
                recordingSeconds={recordingSeconds}
                onToggleRecording={handleToggleRecording}
              />
            </div>

            <div className="mx-auto w-full max-w-xl space-y-3 py-2">
              {liveTranscript && (
                <div className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm">
                  <p className="mb-1 text-[13px] font-semibold text-mute">
                    {state === 'recording' ? 'Hearing' : 'You said'}
                  </p>
                  <p>{liveTranscript}</p>
                </div>
              )}

              {lastAiResponse && (
                <div className="rounded-2xl border border-line bg-accent-soft px-4 py-3 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-mute">{currentVoiceObj.name}</p>
                    {state === 'speaking' && (
                      <button type="button" onClick={stopActiveSpeech} className="inline-flex items-center gap-1 text-[13px] font-semibold text-danger">
                        <Square className="h-3 w-3 fill-current" strokeWidth={1.75} />
                        Stop
                      </button>
                    )}
                  </div>
                  <p>{lastAiResponse}</p>
                </div>
              )}
            </div>

            <div className="mx-auto w-full max-w-xl pt-3">
              <form onSubmit={handleTextSubmit} className="relative">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Type in ${currentLangObj.name}, if you would rather not talk`}
                  disabled={state === 'thinking' || state === 'transcribing'}
                  className="field py-3 pr-12"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || state === 'thinking'}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-accent text-accent-ink disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </form>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-mute">
                <span>{currentLangObj.nativeName}</span>
                {[
                  selectedLanguage.startsWith('te') ? 'ఈ రోజు గురించి ఒక ఆసక్తికరమైన విషయం చెప్పు' :
                  selectedLanguage.startsWith('kn') ? 'ಇವತ್ತಿನ ಬಗ್ಗೆ ಒಂದು ಆಸಕ್ತಿದಾಯಕ ವಿಷಯ ತಿಳಿಸಿ' :
                  selectedLanguage.startsWith('ta') ? 'இன்றைய ஒரு சுவாரஸ்யமான தகவலைச் சொல்லுங்கள்' :
                  selectedLanguage.startsWith('hi') ? 'मुझे आज कोई रोचक बात बताओ' :
                  selectedLanguage.startsWith('es') ? 'Cuéntame algo curioso hoy' :
                  selectedLanguage.startsWith('fr') ? 'Raconte-moi une citation inspirante' :
                  selectedLanguage.startsWith('ja') ? 'おすすめの言葉を教えて' :
                  selectedLanguage.startsWith('de') ? 'Erzähl mir etwas Interessantes' :
                  'Tell me something interesting today'
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setTextInput(prompt)}
                    className="hover:text-ink"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden h-full overflow-hidden p-4 lg:col-span-5 lg:block">
            <TranscriptPanel
              messages={messages}
              onPlaySpeech={(text, audioUrl) => playSpeechAudio(text, audioUrl)}
              isSpeaking={state === 'speaking'}
              onClear={handleStartNewConversation}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

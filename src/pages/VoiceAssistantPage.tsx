import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Sparkles,
  StopCircle,
  Globe,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';

export const VoiceAssistantPage: React.FC = () => {
  const { user, settings, theme, toggleTheme, updateSettings } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    <div className="flex h-screen bg-[#080C14] light:bg-slate-50 text-slate-100 light:text-slate-900 transition-colors duration-200 overflow-hidden">
      {/* Sidebar Navigation */}
      {!fullscreen && (
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      )}

      {/* Main Interface Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 light:border-slate-200 bg-[#080C14]/90 light:bg-white/95 px-4 sm:px-6 backdrop-blur-md transition-colors duration-200">
          <div className="flex items-center gap-3 min-w-0">
            {!fullscreen && (
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-1.5 text-slate-400 light:text-slate-600 hover:bg-slate-800 light:hover:bg-slate-200 hover:text-white light:hover:text-slate-900 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
              <h1 className="text-xs sm:text-sm font-semibold text-white light:text-slate-900 truncate">
                VoxAI Voice Agent
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 light:border-slate-300 bg-slate-900 light:bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-200 light:text-slate-800 hover:border-slate-600 transition-colors">
                <Globe className="h-3.5 w-3.5 text-cyan-400 light:text-indigo-600 shrink-0" />
                <span className="text-sm shrink-0">{currentLangObj.flag}</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-200 light:text-slate-800 focus:outline-none cursor-pointer pr-1"
                  aria-label="Select spoken language"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900"
                    >
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cute Voice Persona Selector Dropdown */}
            <div className="relative hidden md:block">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 light:border-slate-300 bg-slate-900 light:bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-200 light:text-slate-800 hover:border-slate-600 transition-colors">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 light:text-indigo-600 shrink-0" />
                <select
                  value={selectedVoice}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-200 light:text-slate-800 focus:outline-none cursor-pointer"
                  aria-label="Select voice persona"
                >
                  {VOICE_PERSONAS.map((v) => (
                    <option
                      key={v.id}
                      value={v.id}
                      className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900"
                    >
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={() => toggleTheme()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 light:border-slate-300 bg-slate-900 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 transition-all active:scale-95"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            {/* New Session Button */}
            <button
              onClick={handleStartNewConversation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 light:border-slate-300 bg-slate-900 light:bg-slate-100 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 light:text-slate-800 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
              title="Start New Voice Session"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Session</span>
            </button>

            {/* Mute Toggle */}
            <button
              onClick={() => {
                if (state === 'speaking') stopActiveSpeech();
                setIsMuted(!isMuted);
              }}
              className={`rounded-lg p-2 text-xs transition-colors ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 light:text-slate-600 hover:bg-slate-800 light:hover:bg-slate-200 hover:text-slate-200 light:hover:text-slate-900'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="rounded-lg p-2 text-slate-400 light:text-slate-600 hover:bg-slate-800 light:hover:bg-slate-200 hover:text-slate-200 light:hover:text-slate-900 transition-colors"
              title={fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Content Body: Split View (Voice Sphere + Live Transcript) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Visual Voice Sphere & Live Captions */}
          <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto border-r border-slate-800/80 light:border-slate-200">
            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 light:text-rose-700 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200 font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Central Animated Audio Visualizer */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[280px]">
              <VoiceVisualizer
                state={state}
                audioLevel={audioLevel}
                frequencies={frequencies}
                recordingSeconds={recordingSeconds}
                onToggleRecording={handleToggleRecording}
              />
            </div>

            {/* Active Dialogue Bubbles (Transcription & AI Response) */}
            <div className="w-full max-w-xl mx-auto space-y-3 py-2">
              {/* User live speech transcription */}
              {liveTranscript && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 light:bg-cyan-50 light:border-cyan-200 p-3.5 text-xs text-cyan-200 light:text-cyan-900 shadow-xs">
                  <p className="font-semibold text-cyan-400 light:text-cyan-700 text-[11px] uppercase tracking-wider mb-1">
                    {state === 'recording' ? 'Hearing you say...' : 'You said:'}
                  </p>
                  <p className="text-slate-200 light:text-slate-800 italic">"{liveTranscript}"</p>
                </div>
              )}

              {/* Latest AI spoken response preview */}
              {lastAiResponse && (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 light:bg-indigo-50 light:border-indigo-200 p-3.5 text-xs text-indigo-200 light:text-indigo-900 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-indigo-400 light:text-indigo-700 text-[11px] uppercase tracking-wider">
                      VoxAI ({currentVoiceObj.name}):
                    </p>
                    {state === 'speaking' && (
                      <button
                        onClick={stopActiveSpeech}
                        className="flex items-center gap-1 text-[11px] text-rose-400 light:text-rose-600 hover:text-rose-300 font-medium"
                      >
                        <StopCircle className="h-3 w-3" />
                        <span>Stop Voice</span>
                      </button>
                    )}
                  </div>
                  <p className="text-slate-200 light:text-slate-800">{lastAiResponse}</p>
                </div>
              )}
            </div>

            {/* Text Input Fallback Bar */}
            <div className="pt-3 max-w-xl mx-auto w-full">
              <form onSubmit={handleTextSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Or type in ${currentLangObj.name} for VoxAI...`}
                  disabled={state === 'thinking' || state === 'transcribing'}
                  className="w-full rounded-xl border border-slate-700 light:border-slate-300 bg-slate-900/90 light:bg-white pl-4 pr-12 py-3 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || state === 'thinking'}
                  className="absolute right-2 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
                  aria-label="Send text query"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Helpful Language & Prompt suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[11px] text-slate-400 light:text-slate-600">
                <span className="text-[10px] uppercase font-mono tracking-wider opacity-70">Language: {currentLangObj.nativeName} ·</span>
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
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setTextInput(prompt)}
                    className="hover:text-cyan-300 light:hover:text-indigo-600 transition-colors"
                  >
                    · "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Full Conversation Transcript */}
          <div className="lg:col-span-5 h-full p-4 overflow-hidden hidden lg:block">
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

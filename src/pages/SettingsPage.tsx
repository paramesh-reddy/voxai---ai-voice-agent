import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { SUPPORTED_LANGUAGES, VOICE_PERSONAS } from '../utils/constants';
import {
  Menu,
  Volume2,
  Mic,
  Shield,
  Palette,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Globe,
  Sun,
  Moon,
  Heart,
  Sliders,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, theme, toggleTheme } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Local setting state
  const [selectedLanguage, setSelectedLanguage] = useState(settings.language || 'en-US');
  const [selectedVoice, setSelectedVoice] = useState(settings.defaultVoice || 'Kore');
  const [voicePitch, setVoicePitch] = useState(settings.voicePitch || 1.15);
  const [speed, setSpeed] = useState(settings.playbackSpeed || 1.0);
  const [autoPlay, setAutoPlay] = useState(settings.autoPlaySpeech ?? true);
  const [noiseSuppression, setNoiseSuppression] = useState(settings.micNoiseSuppression ?? true);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(theme || 'dark');
  const [retention, setRetention] = useState(settings.audioRetentionDays ?? 0);

  const handleSave = async () => {
    const targetVoiceObj = VOICE_PERSONAS.find((v) => v.id === selectedVoice);
    await updateSettings({
      language: selectedLanguage,
      defaultVoice: selectedVoice,
      voiceGender: targetVoiceObj?.gender || 'female',
      voiceStyle: targetVoiceObj?.speechStyle,
      voicePitch,
      playbackSpeed: speed,
      autoPlaySpeech: autoPlay,
      micNoiseSuppression: noiseSuppression,
      theme: currentTheme,
      audioRetentionDays: retention,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setCurrentTheme(newTheme);
    toggleTheme(newTheme);
  };

  const testVoiceSample = (vId: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const voiceObj = VOICE_PERSONAS.find((v) => v.id === vId) || VOICE_PERSONAS[0];
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

    // Cute localized greetings
    let sampleText = `Hi! I am your cute and cheerful AI assistant. I love chatting with you!`;
    if (selectedLanguage.startsWith('es')) {
      sampleText = `¡Hola! Soy tu asistente favorita y me encanta hablar contigo.`;
    } else if (selectedLanguage.startsWith('fr')) {
      sampleText = `Coucou ! Je suis votre assistante préférée et j’adore échanger avec vous.`;
    } else if (selectedLanguage.startsWith('ja')) {
      sampleText = `こんにちは！あなたの可愛いAIアシスタントです。お話しできてとっても嬉しいです！`;
    } else if (selectedLanguage.startsWith('de')) {
      sampleText = `Hallo! Ich bin deine fröhliche KI-Assistentin und freue mich auf unser Gespräch!`;
    } else if (selectedLanguage.startsWith('ko')) {
      sampleText = `안녕하세요! 저는 당신의 귀여운 AI 친구예요. 만나서 정말 기뻐요!`;
    } else if (selectedLanguage.startsWith('zh')) {
      sampleText = `你好呀！我是你可爱的AI语音助手，很高兴和你在一起聊天！`;
    } else if (selectedLanguage.startsWith('hi')) {
      sampleText = `नमस्ते! मैं आपकी प्यारी और मददगार वॉइस असिस्टेंट हूँ।`;
    }

    const u = new SpeechSynthesisUtterance(sampleText);
    u.rate = speed;
    u.pitch = voicePitch;
    u.lang = selectedLanguage;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="flex h-screen bg-[#080C14] light:bg-slate-50 text-slate-100 light:text-slate-900 transition-colors duration-200 overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 light:border-slate-200 bg-[#080C14]/90 light:bg-white/95 px-6 backdrop-blur-md transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-slate-400 light:text-slate-600 hover:bg-slate-800 light:hover:bg-slate-200 hover:text-white light:hover:text-slate-900 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400 light:text-slate-600">
              <span>Overview</span>
              <span>/</span>
              <span className="text-slate-200 light:text-slate-900 font-medium">Assistant Settings</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save All Changes</span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white light:text-slate-900">
              Settings & Preferences
            </h1>
            <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
              Select your spoken language (English by default), customize cute voice personas for male and female, and toggle theme mode.
            </p>
          </div>

          {/* Section 1: Dark and Light Switching */}
          <div className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 light:text-indigo-600">
              <Palette className="h-4 w-4" />
              <span>Appearance & Theme Mode</span>
            </div>

            <p className="text-xs text-slate-400 light:text-slate-600">
              Switch smoothly between dark space theme and crisp daylight theme.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Dark Option */}
              <div
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  currentTheme === 'dark'
                    ? 'border-indigo-500 bg-indigo-950/40 shadow-sm'
                    : 'border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-slate-50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-amber-400 shadow-inner">
                    <Moon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white light:text-slate-900">Dark Mode</p>
                    <p className="text-[11px] text-slate-400">Deep obsidian & glowing cyan</p>
                  </div>
                </div>
                {currentTheme === 'dark' && <Check className="h-4 w-4 text-cyan-400" />}
              </div>

              {/* Light Option */}
              <div
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  currentTheme === 'light'
                    ? 'border-indigo-500 bg-indigo-50/80 light:bg-indigo-50 shadow-sm'
                    : 'border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-slate-50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-500 shadow-inner">
                    <Sun className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white light:text-slate-900">Light Mode</p>
                    <p className="text-[11px] text-slate-400 light:text-slate-500">Crisp slate & bright daylight</p>
                  </div>
                </div>
                {currentTheme === 'light' && <Check className="h-4 w-4 text-indigo-600" />}
              </div>
            </div>
          </div>

          {/* Section 2: Language Settings */}
          <div className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 light:text-indigo-600">
                <Globe className="h-4 w-4" />
                <span>Conversation Language (Default: English)</span>
              </div>
              <span className="text-[11px] text-slate-400 light:text-slate-500">
                Active: {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name}
              </span>
            </div>

            <p className="text-xs text-slate-400 light:text-slate-600">
              Select what language you want VoxAI to speak and listen in. VoxAI will automatically transcribe your voice and respond in this language.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 light:bg-indigo-50 shadow-sm'
                        : 'border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-slate-50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{lang.flag}</span>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white light:text-indigo-900' : 'text-slate-300 light:text-slate-700'}`}>
                          {lang.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{lang.nativeName}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400 light:text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Cute Voice Personas (Women & Male) */}
          <div className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 light:text-indigo-600">
                <Heart className="h-4 w-4 text-rose-400" />
                <span>Cute Spoken Voice Personas (Female & Male)</span>
              </div>
              <span className="text-[11px] text-rose-400 font-medium">Sweet & Cheerful options</span>
            </div>

            <p className="text-xs text-slate-400 light:text-slate-600">
              Pick your favorite cute voice. Tap the play button on any card to audition how cheerful and cute the voice sounds!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {VOICE_PERSONAS.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 light:bg-indigo-50 shadow-sm'
                        : 'border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-slate-50 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white light:text-slate-900">{v.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            v.gender === 'female'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            {v.tag}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            testVoiceSample(v.id);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 light:bg-indigo-100 light:hover:bg-indigo-200 text-indigo-300 light:text-indigo-700 text-[11px] transition-colors"
                          title="Audition Cute Voice"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Preview</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 light:text-slate-600 leading-relaxed">{v.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 light:border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 text-[10px]">Model: Gemini TTS + Web Speech</span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-cyan-400 light:text-indigo-600 font-semibold text-xs">
                          <Check className="h-3.5 w-3.5" /> Selected
                        </span>
                      ) : (
                        <span className="text-slate-500 hover:text-slate-300">Select voice</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extra Cute Pitch & Tone Slider */}
            <div className="pt-4 border-t border-slate-800 light:border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white light:text-slate-900 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Cute Voice Pitch Adjustment ({voicePitch.toFixed(2)}x)</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Higher pitch produces a cuter, animated, cheerful cadence</p>
                </div>
                <button
                  type="button"
                  onClick={() => testVoiceSample(selectedVoice)}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 light:border-slate-300 text-xs text-slate-300 light:text-slate-700 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Test Sample
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] text-slate-500">Normal (1.0x)</span>
                <input
                  type="range"
                  min="0.9"
                  max="1.4"
                  step="0.05"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-800 light:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[11px] text-rose-400 font-medium">Extra Cute (1.4x)</span>
              </div>
            </div>
          </div>

          {/* Section 4: Acoustic Playback & Telemetry */}
          <div className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 light:text-indigo-600">
              <Sparkles className="h-4 w-4" />
              <span>Acoustic Playback Speed & Controls</span>
            </div>

            <div className="space-y-4 text-xs text-slate-300 light:text-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white light:text-slate-900">Playback Speed ({speed}x)</p>
                  <p className="text-[11px] text-slate-500">Adjust how fast assistant responses are spoken</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 light:bg-slate-100 p-1 rounded-lg border border-slate-800 light:border-slate-300">
                  {[0.75, 1.0, 1.25, 1.5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSpeed(val)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        speed === val
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                      }`}
                    >
                      {val}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 light:border-slate-200">
                <div>
                  <p className="font-semibold text-white light:text-slate-900">Auto-Play Spoken Response</p>
                  <p className="text-[11px] text-slate-500">Automatically stream speech audio when turn completes</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 light:border-slate-200">
                <div>
                  <p className="font-semibold text-white light:text-slate-900">Microphone Noise Suppression</p>
                  <p className="text-[11px] text-slate-500">Filter background hum and room echo from input speech</p>
                </div>
                <input
                  type="checkbox"
                  checked={noiseSuppression}
                  onChange={(e) => setNoiseSuppression(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

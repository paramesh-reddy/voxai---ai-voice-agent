import React, { useState } from 'react';
import { Check, Moon, Play, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { SUPPORTED_LANGUAGES, VOICE_PERSONAS } from '../utils/constants';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, theme, toggleTheme } = useAuth();
  const [savedSuccess, setSavedSuccess] = useState(false);
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
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setCurrentTheme(newTheme);
    toggleTheme(newTheme);
  };

  const testVoiceSample = (voiceId: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const samples: Record<string, string> = {
      es: 'Hola. Esta es una muestra breve de cómo sueno.',
      fr: 'Bonjour. Voici un court extrait pour entendre ma voix.',
      ja: 'こんにちは。声のサンプルです。',
      de: 'Hallo. Das ist eine kurze Probe meiner Stimme.',
      ko: '안녕하세요. 목소리 샘플입니다.',
      zh: '你好。这是一段简短的声音示例。',
      hi: 'नमस्ते। यह मेरी आवाज़ का एक छोटा नमूना है।',
      te: 'నమస్కారం. ఇది నా స్వరం యొక్క చిన్న నమూనా.',
      kn: 'ನಮಸ್ಕಾರ. ಇದು ನನ್ನ ಧ್ವನಿಯ ಚಿಕ್ಕ ಮಾದರಿ.',
      ta: 'வணக்கம். இது என் குரலின் ஒரு சிறிய மாதிரி.',
    };
    const prefix = selectedLanguage.slice(0, 2);
    const sampleText = samples[prefix] || 'Hi. This is a short sample so you can hear the voice.';
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = speed;
    utterance.pitch = voicePitch;
    utterance.lang = selectedLanguage;
    window.speechSynthesis.speak(utterance);
    void voiceId;
  };

  return (
    <AppShell
      title="Settings"
      actions={
        <button type="button" onClick={handleSave} className="btn btn-primary h-9 px-3 text-sm">
          {savedSuccess ? (
            <>
              <Check className="h-4 w-4" strokeWidth={1.75} />
              Saved
            </>
          ) : (
            'Save'
          )}
        </button>
      }
    >
      <header className="max-w-2xl">
        <h2 className="font-display text-4xl tracking-tight">Preferences</h2>
        <p className="mt-2 text-[15px] text-mute">Language, voice, and how replies are played. Changes apply after you save.</p>
      </header>

      <section className="card p-5 sm:p-6">
        <h3 className="text-lg font-semibold">Appearance</h3>
        <p className="mt-1 text-sm text-mute">Same layout in both. Pick the one that is easier on your eyes.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Choice
            selected={currentTheme === 'dark'}
            onClick={() => handleThemeChange('dark')}
            icon={<Moon className="h-4 w-4" strokeWidth={1.75} />}
            title="Dark"
            detail="Warm charcoal, for late sessions."
          />
          <Choice
            selected={currentTheme === 'light'}
            onClick={() => handleThemeChange('light')}
            icon={<Sun className="h-4 w-4" strokeWidth={1.75} />}
            title="Light"
            detail="Paper background, for daytime."
          />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold">Language</h3>
          <span className="text-sm text-mute">{SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.nativeName}</span>
        </div>
        <p className="mt-1 text-sm text-mute">Tara listens and answers in this language.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const selected = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLanguage(lang.code)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  selected ? 'border-accent bg-accent-soft' : 'border-line hover:bg-panel-2'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{lang.name}</span>
                  <span className="block truncate text-[12px] text-mute">{lang.nativeName}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h3 className="text-lg font-semibold">Voice</h3>
        <p className="mt-1 text-sm text-mute">Play a sample before you commit. Pitch only affects the browser voice.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {VOICE_PERSONAS.map((voice) => {
            const selected = selectedVoice === voice.id;
            return (
              <div
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  selected ? 'border-accent bg-accent-soft' : 'border-line hover:bg-panel-2'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {voice.name} <span className="text-sm font-medium text-mute">· {voice.tag}</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-mute">{voice.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      testVoiceSample(voice.id);
                    }}
                    className="icon-btn shrink-0 border border-line"
                    aria-label={`Preview ${voice.name}`}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" strokeWidth={1.75} />
                  </button>
                </div>
                {selected && <p className="mt-3 text-sm font-semibold text-accent">Selected</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Pitch · {voicePitch.toFixed(2)}</p>
              <p className="text-sm text-mute">Leave this near the middle unless a voice feels too low or too high.</p>
            </div>
            <button type="button" onClick={() => testVoiceSample(selectedVoice)} className="btn btn-quiet h-9 px-3 text-sm">
              Hear it
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm text-mute">
            <span>Lower</span>
            <input
              type="range"
              min="0.9"
              max="1.4"
              step="0.05"
              value={voicePitch}
              onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer accent-[var(--accent)]"
            />
            <span>Higher</span>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5 sm:p-6">
        <h3 className="text-lg font-semibold">Playback</h3>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Speed</p>
            <p className="text-sm text-mute">How fast spoken replies play.</p>
          </div>
          <div className="flex rounded-lg border border-line p-1">
            {[0.75, 1, 1.25, 1.5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSpeed(value)}
                className={`rounded-md px-2.5 py-1 text-sm font-semibold ${
                  speed === value ? 'bg-ink text-paper' : 'text-mute hover:text-ink'
                }`}
              >
                {value}×
              </button>
            ))}
          </div>
        </div>
        <Toggle
          title="Play replies automatically"
          detail="Start the voice as soon as a turn is ready."
          checked={autoPlay}
          onChange={setAutoPlay}
        />
        <Toggle
          title="Reduce background noise"
          detail="Ask the microphone to filter hum and room echo."
          checked={noiseSuppression}
          onChange={setNoiseSuppression}
        />
        <p className="text-sm text-mute">Audio retention is set to {retention === 0 ? 'none' : `${retention} days`}. Recordings are not stored after a turn.</p>
      </section>
    </AppShell>
  );
};

const Choice: React.FC<{
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  detail: string;
}> = ({ selected, onClick, icon, title, detail }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
      selected ? 'border-accent bg-accent-soft' : 'border-line hover:bg-panel-2'
    }`}
  >
    <span className="mt-0.5 text-accent">{icon}</span>
    <span>
      <span className="block font-semibold">{title}</span>
      <span className="mt-0.5 block text-sm text-mute">{detail}</span>
    </span>
  </button>
);

const Toggle: React.FC<{
  title: string;
  detail: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ title, detail, checked, onChange }) => (
  <label className="flex items-center justify-between gap-4 border-t border-line pt-4">
    <span>
      <span className="block font-semibold">{title}</span>
      <span className="block text-sm text-mute">{detail}</span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-[var(--accent)]"
    />
  </label>
);

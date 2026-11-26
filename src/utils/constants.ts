import { LanguageOption, VoiceOption } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
];

export const VOICE_PERSONAS: VoiceOption[] = [
  // Cute & Cheerful Female Options
  {
    id: 'Kore',
    name: 'Kore (Cute & Cheerful)',
    tag: 'Cute Female',
    gender: 'female',
    pitch: 1.2,
    description: 'Bubbly, warm, sweet and enthusiastic tone. Perfect for everyday friendly companion.',
    geminiVoice: 'Kore',
    speechStyle: 'Cute, cheerful, enthusiastic, sweet and friendly young female voice',
  },
  {
    id: 'Charon',
    name: 'Charon (Sweet & Melodic)',
    tag: 'Gentle Female',
    gender: 'female',
    pitch: 1.15,
    description: 'Soft-spoken, comforting, sweet and gentle female tone with melodic rhythm.',
    geminiVoice: 'Charon',
    speechStyle: 'Sweet, gentle, soothing, warm and affectionate female voice',
  },

  // Cute & Playful Male Options
  {
    id: 'Puck',
    name: 'Puck (Cute & Playful)',
    tag: 'Cute Male',
    gender: 'male',
    pitch: 1.15,
    description: 'Playful, lively, cheerful boyish tone with high energy and friendly charm.',
    geminiVoice: 'Puck',
    speechStyle: 'Cute, cheerful, playful, energetic and friendly young boyish male voice',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr (Cute & Gentle)',
    tag: 'Gentle Male',
    gender: 'male',
    pitch: 1.1,
    description: 'Soft, polite, cheerful anime-style young male companion with kind articulation.',
    geminiVoice: 'Zephyr',
    speechStyle: 'Cute, gentle, polite, friendly and warm young male voice',
  },

  // Classic Calm Male Option
  {
    id: 'Fenrir',
    name: 'Fenrir (Deep & Grounded)',
    tag: 'Calm Male',
    gender: 'male',
    pitch: 0.95,
    description: 'Deep, resonant, authoritative yet calm acoustic timbre for serious discussions.',
    geminiVoice: 'Fenrir',
    speechStyle: 'Deep, calm, resonant and grounded authoritative male voice',
  },
];

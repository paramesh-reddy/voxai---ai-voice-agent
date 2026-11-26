export interface User {
  id: string;
  fullName: string;
  email: string;
  authProvider: 'local' | 'google';
  createdAt: string;
}

export interface UserSettings {
  userId?: string;
  defaultVoice: string;
  voiceGender?: 'female' | 'male';
  voiceStyle?: string;
  voicePitch?: number; // e.g. 1.0 - 1.3 for cute voices
  language: string; // e.g. 'en-US', 'es-ES', 'ja-JP', 'fr-FR', etc.
  playbackSpeed: number;
  autoPlaySpeech: boolean;
  micNoiseSuppression: boolean;
  theme: 'dark' | 'light' | 'system';
  audioRetentionDays: number;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  tag: string;
  gender: 'female' | 'male';
  pitch: number;
  description: string;
  geminiVoice: string;
  speechStyle: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  inputType: 'voice' | 'text';
  audioDataUrl?: string;
  createdAt: string;
}

export type VoiceState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'recording'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'paused'
  | 'error';

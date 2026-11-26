import axios from 'axios';
import { Conversation, Message, User, UserSettings } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('voxai_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('voxai_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          const newAccessToken = res.data.accessToken;
          localStorage.setItem('voxai_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('voxai_access_token');
          localStorage.removeItem('voxai_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { fullName: string; email: string; password: string }) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', data),

  googleVerify: (data: { credential?: string; email?: string; name?: string; sub?: string }) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/google/verify', data),

  getGoogleLoginUrl: () =>
    api.get<{ configured: boolean; url?: string; message?: string }>('/auth/google/login'),

  me: () =>
    api.get<User & { settings: UserSettings }>('/auth/me'),

  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refreshToken }),
};

export const conversationsApi = {
  list: () =>
    api.get<Conversation[]>('/conversations'),

  create: (title?: string) =>
    api.post<Conversation>('/conversations', { title }),

  get: (id: string) =>
    api.get<Conversation & { messages: Message[] }>(`/conversations/${id}`),

  rename: (id: string, title: string) =>
    api.patch<Conversation>(`/conversations/${id}`, { title }),

  delete: (id: string) =>
    api.delete(`/conversations/${id}`),
};

export const settingsApi = {
  get: () =>
    api.get<UserSettings>('/settings'),

  update: (data: Partial<UserSettings>) =>
    api.put<UserSettings>('/settings', data),
};

export const voiceApi = {
  transcribe: (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'speech.webm');
    return api.post<{ text: string }>('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  chat: (message: string, conversationId?: string, language?: string, voice?: string, voiceStyle?: string) =>
    api.post<{ conversationId: string; userMessage: Message; assistantMessage: Message }>('/voice/chat', {
      message,
      conversationId,
      language,
      voice,
      voiceStyle,
    }),

  synthesize: (text: string, voice?: string, style?: string) =>
    api.post<{ audioDataUrl: string; format: string }>('/voice/synthesize', {
      text,
      voice,
      style,
    }),

  turn: (data: {
    audioBlob?: Blob;
    textFallback?: string;
    conversationId?: string;
    language?: string;
    voice?: string;
    voiceStyle?: string;
  }) => {
    const formData = new FormData();
    if (data.audioBlob) {
      formData.append('audio', data.audioBlob, 'speech.webm');
    }
    if (data.textFallback) {
      formData.append('textFallback', data.textFallback);
    }
    if (data.conversationId) {
      formData.append('conversationId', data.conversationId);
    }
    if (data.language) {
      formData.append('language', data.language);
    }
    if (data.voice) {
      formData.append('voice', data.voice);
    }
    if (data.voiceStyle) {
      formData.append('voiceStyle', data.voiceStyle);
    }

    return api.post<{
      conversationId: string;
      transcription: string;
      response: string;
      audioDataUrl?: string;
      userMessage: Message;
      assistantMessage: Message;
    }>('/voice/turn', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;

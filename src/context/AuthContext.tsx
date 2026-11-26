import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserSettings } from '../types';
import { authApi, settingsApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  settings: UserSettings;
  isLoading: boolean;
  isAuthenticated: boolean;
  theme: 'dark' | 'light';
  toggleTheme: (forcedTheme?: 'dark' | 'light') => void;
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (data?: { email?: string; name?: string; sub?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  defaultVoice: 'Kore',
  voiceGender: 'female',
  voiceStyle: 'Cute, cheerful, warm, sweet and enthusiastic tone',
  voicePitch: 1.15,
  language: 'en-US',
  playbackSpeed: 1.0,
  autoPlaySpeech: true,
  micNoiseSuppression: true,
  theme: 'dark',
  audioRetentionDays: 0,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Theme state: initialized from localStorage or default 'dark'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('voxai_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('voxai_theme', theme);
  }, [theme]);

  const toggleTheme = (forcedTheme?: 'dark' | 'light') => {
    const next = forcedTheme ? forcedTheme : (theme === 'dark' ? 'light' : 'dark');
    setTheme(next);
    updateSettings({ theme: next });
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('voxai_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.me();
      setUser({
        id: res.data.id,
        fullName: res.data.fullName,
        email: res.data.email,
        authProvider: res.data.authProvider,
        createdAt: res.data.createdAt,
      });
      if (res.data.settings) {
        setSettings(res.data.settings);
        if (res.data.settings.theme === 'light' || res.data.settings.theme === 'dark') {
          setTheme(res.data.settings.theme);
        }
      }
    } catch (err) {
      console.warn('Failed to restore user session:', err);
      localStorage.removeItem('voxai_access_token');
      localStorage.removeItem('voxai_refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('voxai_access_token', res.data.accessToken);
    localStorage.setItem('voxai_refresh_token', res.data.refreshToken);
    setUser(res.data.user);
    try {
      const s = await settingsApi.get();
      setSettings(s.data);
      if (s.data.theme === 'light' || s.data.theme === 'dark') {
        setTheme(s.data.theme);
      }
    } catch {
      // use default
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await authApi.register({ fullName, email, password });
    localStorage.setItem('voxai_access_token', res.data.accessToken);
    localStorage.setItem('voxai_refresh_token', res.data.refreshToken);
    setUser(res.data.user);
    try {
      const s = await settingsApi.get();
      setSettings(s.data);
    } catch {
      // use default
    }
  };

  const loginWithGoogle = async (data?: { email?: string; name?: string; sub?: string }) => {
    const res = await authApi.googleVerify({
      email: data?.email || 'google.user@voxai.internal',
      name: data?.name || 'Google User',
      sub: data?.sub || 'g_auth_' + Date.now(),
    });
    localStorage.setItem('voxai_access_token', res.data.accessToken);
    localStorage.setItem('voxai_refresh_token', res.data.refreshToken);
    setUser(res.data.user);
    try {
      const s = await settingsApi.get();
      setSettings(s.data);
    } catch {
      // use default
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('voxai_refresh_token') || undefined;
    try {
      await authApi.logout(refreshToken);
    } catch (err) {
      console.warn('Error during logout:', err);
    }
    localStorage.removeItem('voxai_access_token');
    localStorage.removeItem('voxai_refresh_token');
    setUser(null);
    setSettings(defaultSettings);
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    try {
      const updated = await settingsApi.update(newSettings);
      setSettings(updated.data);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const setLanguage = async (lang: string) => {
    await updateSettings({ language: lang });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        isLoading,
        isAuthenticated: !!user,
        theme,
        toggleTheme,
        language: settings.language || 'en-US',
        setLanguage,
        login,
        register,
        loginWithGoogle,
        logout,
        updateSettings,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

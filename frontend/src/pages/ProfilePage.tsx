import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { SUPPORTED_LANGUAGES, VOICE_PERSONAS } from '../utils/constants';

export const ProfilePage: React.FC = () => {
  const { user, logout, settings } = useAuth();
  const navigate = useNavigate();
  const language = SUPPORTED_LANGUAGES.find((item) => item.code === settings.language);
  const voice = VOICE_PERSONAS.find((item) => item.id === settings.defaultVoice);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppShell title="Profile">
      <section className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink font-display text-3xl text-paper">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="font-display text-4xl tracking-tight">{user?.fullName || 'Account'}</h2>
            <p className="mt-1 text-mute">{user?.email}</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="btn btn-danger">
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          Sign out
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Fact label="Signed in with" value={user?.authProvider === 'google' ? 'Google' : 'Email and password'} />
        <Fact label="Language" value={language ? `${language.flag} ${language.name}` : 'English (US)'} />
        <Fact label="Voice" value={voice ? `${voice.name} · ${voice.tag}` : 'Kore'} />
        <Fact
          label="Account opened"
          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Today'}
        />
      </section>
    </AppShell>
  );
};

const Fact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-line bg-panel px-4 py-4">
    <p className="text-sm text-mute">{label}</p>
    <p className="mt-1 font-semibold">{value}</p>
  </div>
);

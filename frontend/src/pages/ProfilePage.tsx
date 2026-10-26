import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import {
  Menu,
  User as UserIcon,
  Mail,
  ShieldCheck,
  Calendar,
  LogOut,
  Key,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout, theme, toggleTheme, settings } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
              <span className="text-slate-200 light:text-slate-900 font-medium">Account Profile</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white light:text-slate-900">User Profile & Credentials</h1>
            <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
              Manage your verified credentials, active language preference, and security status.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-6 space-y-6 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-xl font-bold text-white shadow-lg shadow-indigo-600/30">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-white light:text-slate-900">{user?.fullName || 'Active User'}</h2>
                <p className="text-xs text-slate-400 light:text-slate-600">{user?.email || ''}</p>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-cyan-300 light:text-indigo-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified Account ({user?.authProvider === 'google' ? 'Google OAuth' : 'Email & Password'})</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 light:border-slate-200 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-800 light:border-slate-200 bg-slate-950/60 light:bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 light:text-slate-500">
                  <Mail className="h-4 w-4 text-indigo-400 light:text-indigo-600" />
                  <span>Primary Email</span>
                </div>
                <p className="font-semibold text-white light:text-slate-900 truncate">{user?.email}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 light:border-slate-200 bg-slate-950/60 light:bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 light:text-slate-500">
                  <Globe className="h-4 w-4 text-cyan-400 light:text-cyan-600" />
                  <span>Configured Language</span>
                </div>
                <p className="font-semibold text-white light:text-slate-900">
                  {settings.language || 'English (US)'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 light:border-slate-200 bg-slate-950/60 light:bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 light:text-slate-500">
                  <Calendar className="h-4 w-4 text-purple-400 light:text-purple-600" />
                  <span>Account Created</span>
                </div>
                <p className="font-semibold text-white light:text-slate-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 light:border-slate-200 bg-slate-950/60 light:bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 light:text-slate-500">
                  <Key className="h-4 w-4 text-emerald-400 light:text-emerald-600" />
                  <span>Security & Tokens</span>
                </div>
                <p className="font-semibold text-emerald-400 light:text-emerald-600">JWT Authenticated (15m)</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 light:border-slate-200 flex justify-end">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600/20 border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-300 light:text-rose-700 hover:bg-rose-600/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

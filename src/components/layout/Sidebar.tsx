import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTED_LANGUAGES, VOICE_PERSONAS } from '../../utils/constants';
import {
  LayoutDashboard,
  Mic,
  History,
  Settings,
  User as UserIcon,
  LogOut,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout, theme, toggleTheme, settings } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Voice Assistant', to: '/assistant', icon: Mic, highlight: true },
    { name: 'Conversation History', to: '/history', icon: History },
    { name: 'Settings', to: '/settings', icon: Settings },
    { name: 'Profile', to: '/profile', icon: UserIcon },
  ];

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === settings.language) || SUPPORTED_LANGUAGES[0];
  const currentVoice = VOICE_PERSONAS.find((v) => v.id === settings.defaultVoice) || VOICE_PERSONAS[0];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 light:border-slate-200 bg-[#090D16] light:bg-slate-50 transition-colors duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 light:border-slate-200 px-6">
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white shadow-md shadow-indigo-500/20">
              <Mic className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white light:text-slate-900">
              Vox<span className="text-cyan-400">AI</span>
            </span>
          </NavLink>

          <div className="flex items-center gap-1">
            {/* Theme Toggle Button */}
            <button
              onClick={() => toggleTheme()}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 hover:bg-slate-800/60 light:hover:bg-slate-200 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            <button
              onClick={onCloseMobile}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Launch Voice Banner */}
        <div className="p-4 space-y-2">
          <NavLink
            to="/assistant"
            onClick={onCloseMobile}
            className="group flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-900/40 via-indigo-800/30 to-cyan-900/30 light:from-indigo-100 light:via-indigo-50 light:to-cyan-50 p-3.5 border border-indigo-500/20 light:border-indigo-200 shadow-inner hover:border-indigo-400/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-cyan-400 light:text-indigo-600 group-hover:scale-105 transition-transform">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white light:text-slate-900">Live Voice Agent</p>
                <p className="text-[11px] text-slate-400 light:text-slate-500">Tap to start speaking</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 light:text-slate-500 group-hover:text-cyan-300 light:group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
          </NavLink>

          {/* Active Language & Persona Pill */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/50 light:bg-white border border-slate-800/60 light:border-slate-200 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400 light:text-slate-600">
              <span className="text-sm">{currentLang.flag}</span>
              <span>{currentLang.name.split(' ')[0]}</span>
            </span>
            <span className="text-cyan-400 light:text-indigo-600 font-medium">
              {currentVoice.tag}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/15 light:bg-indigo-100 text-indigo-300 light:text-indigo-700 border border-indigo-500/30 light:border-indigo-300'
                      : 'text-slate-400 light:text-slate-600 hover:bg-slate-800/60 light:hover:bg-slate-200/60 hover:text-slate-200 light:hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Sign Out footer */}
        <div className="border-t border-slate-800/80 light:border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 light:bg-slate-200 text-xs font-semibold text-indigo-300 light:text-indigo-700 border border-slate-700 light:border-slate-300">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-200 light:text-slate-900">{user?.fullName || 'User'}</p>
                <p className="truncate text-[11px] text-slate-400 light:text-slate-500">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-400 light:text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

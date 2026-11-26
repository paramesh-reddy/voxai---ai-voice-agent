import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  History,
  LayoutDashboard,
  LogOut,
  Mic,
  Settings,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTED_LANGUAGES, VOICE_PERSONAS } from '../../utils/constants';
import { Wordmark } from '../brand/BrandMark';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { name: 'Home', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Talk', to: '/assistant', icon: Mic },
  { name: 'History', to: '/history', icon: History },
  { name: 'Settings', to: '/settings', icon: Settings },
  { name: 'Profile', to: '/profile', icon: UserIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout, settings } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === settings.language) || SUPPORTED_LANGUAGES[0];
  const currentVoice = VOICE_PERSONAS.find((v) => v.id === settings.defaultVoice) || VOICE_PERSONAS[0];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close navigation"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-line bg-panel transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Wordmark to="/dashboard" />
          <button type="button" onClick={onCloseMobile} className="icon-btn lg:hidden" aria-label="Close navigation">
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-3 pb-2">
          <NavLink
            to="/assistant"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 rounded-xl bg-ink px-3 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
          >
            <Mic className="h-4 w-4" strokeWidth={1.75} />
            New conversation
          </NavLink>
          <p className="mt-3 px-1 text-[13px] text-mute">
            {currentLang.flag} {currentLang.name.split(' ')[0]} · {currentVoice.name}
          </p>
        </div>

        <nav className="mt-2 flex-1 space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[15px] transition-colors ${
                    isActive ? 'bg-accent-soft font-semibold text-ink' : 'text-mute hover:bg-panel-2 hover:text-ink'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-panel-2 text-sm font-semibold">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.fullName || 'Account'}</p>
              <p className="truncate text-[13px] text-mute">{user?.email || ''}</p>
            </div>
            <button type="button" onClick={handleLogout} className="icon-btn" title="Sign out" aria-label="Sign out">
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

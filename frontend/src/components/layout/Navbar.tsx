import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mic, ArrowRight, Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, theme, toggleTheme } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#090D16]/90 light:bg-white/95 light:border-slate-200/90 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <Link to="/" className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/25 transition-transform duration-200 group-hover:scale-105">
            <Mic className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white light:text-slate-900">
            Vox<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
          </span>
        </Link>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300 light:text-slate-600">
          <a href="/#features" className="hover:text-white light:hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Features
          </a>
          <a href="/#how-it-works" className="hover:text-white light:hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            How It Works
          </a>
          <a href="/#architecture" className="hover:text-white light:hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Architecture
          </a>
          <a href="/#security" className="hover:text-white light:hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Security
          </a>
        </nav>

        {/* Zone 3: Primary Action + Dark/Light Mode Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={() => toggleTheme()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 light:bg-slate-100 light:border-slate-300 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 transition-all active:scale-95 shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all whitespace-nowrap shrink-0"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:from-indigo-500 hover:to-cyan-500 active:scale-95 transition-all whitespace-nowrap shrink-0"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

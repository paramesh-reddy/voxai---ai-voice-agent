import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Wordmark } from '../brand/BrandMark';

export const AuthFrame: React.FC<{ title: string; subtitle: React.ReactNode; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => {
  const { theme, toggleTheme } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col bg-paper px-4 py-10 text-ink">
      <div className="absolute right-4 top-4">
        <button
          type="button"
          onClick={() => toggleTheme()}
          className="icon-btn"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-6">
          <Wordmark />
          <h1 className="mt-6 font-display text-3xl tracking-tight">{title}</h1>
          <p className="mt-2 text-[15px] text-mute">{subtitle}</p>
        </div>
        <div className="card p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

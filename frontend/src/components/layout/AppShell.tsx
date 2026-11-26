import React, { useState } from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  padded?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ title, actions, children, padded = true }) => {
  const { theme, toggleTheme } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="icon-btn lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <h1 className="truncate text-[15px] font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={() => toggleTheme()}
              className="icon-btn"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </header>
        {padded ? (
          <div className="flex-1 overflow-y-auto">
            <main className="page-in mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        )}
      </div>
    </div>
  );
};

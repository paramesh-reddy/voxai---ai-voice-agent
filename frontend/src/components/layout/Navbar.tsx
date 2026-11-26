import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Wordmark } from '../brand/BrandMark';

const links = [
  { href: '/#product', label: 'Product' },
  { href: '/#how', label: 'How it works' },
  { href: '/#privacy', label: 'Privacy' },
];

export const Navbar: React.FC = () => {
  const { isAuthenticated, theme, toggleTheme } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-6">
        <Wordmark />

        <nav className="hidden items-center gap-7 text-[15px] text-mute md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleTheme()}
            className="icon-btn"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
          </button>

          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary hidden sm:inline-flex">
              Open app
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden px-2 text-[15px] font-semibold text-mute transition-colors hover:text-ink sm:inline">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary hidden sm:inline-flex">
                Create account
              </Link>
            </>
          )}

          <button
            type="button"
            className="icon-btn md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-[15px]">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-1 text-mute hover:text-ink">
                {link.label}
              </a>
            ))}
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary mt-2" onClick={() => setOpen(false)}>
                Open app
              </Link>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link to="/login" className="btn btn-quiet flex-1" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary flex-1" onClick={() => setOpen(false)}>
                  Create account
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

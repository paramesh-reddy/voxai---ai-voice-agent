import React from 'react';
import { Link } from 'react-router-dom';

export const PRODUCT_TITLE = 'Tara';

export const Mark: React.FC<{ className?: string }> = ({ className = 'h-9 w-9' }) => (
  <svg viewBox="0 0 40 40" className={`shrink-0 ${className}`} aria-hidden>
    <rect width="40" height="40" rx="13" fill="#c45c26" />
    <rect x="1.4" y="1.4" width="37.2" height="37.2" rx="12" fill="none" stroke="#fff4ea" strokeOpacity="0.38" />
    <path d="M11 12.2h18" fill="none" stroke="#fffaf6" strokeWidth="3.1" strokeLinecap="round" />
    <path d="M20 12.2v16.2" fill="none" stroke="#fffaf6" strokeWidth="3.1" strokeLinecap="round" />
    <path
      d="M26.2 17.2c1.7 1.15 2.7 2.55 2.7 3.9s-1 2.75-2.7 3.9"
      fill="none"
      stroke="#fffaf6"
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);

export const Wordmark: React.FC<{ to?: string; className?: string }> = ({ to = '/', className = '' }) => {
  const inner = (
    <>
      <Mark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.45rem] tracking-[-0.03em] text-ink">{PRODUCT_TITLE}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Speak</span>
      </span>
    </>
  );

  const classes = `inline-flex items-center gap-2.5 ${className}`;
  if (!to) return <span className={classes}>{inner}</span>;
  return (
    <Link to={to} className={classes} aria-label={`${PRODUCT_TITLE} home`}>
      {inner}
    </Link>
  );
};

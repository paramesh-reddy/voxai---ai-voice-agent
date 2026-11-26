import React from 'react';
import { Link } from 'react-router-dom';

const bars = [0.45, 0.7, 1, 0.62, 0.84, 0.5, 0.92, 0.66, 0.4];

export const HeroVisual: React.FC = () => {
  return (
    <div className="rise rise-d2 relative">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-semibold">Listening</span>
            <span className="text-mute">00:12</span>
          </div>
          <span className="text-[13px] text-mute">English · Kore</span>
        </div>

        <div className="flex h-16 items-end justify-center gap-1.5 px-6 pt-5" aria-hidden>
          {bars.map((height, index) => (
            <span
              key={index}
              className="eq-bar w-1.5 rounded-full bg-accent"
              style={{ height: `${height * 100}%`, animationDelay: `${index * 0.08}s`, opacity: 0.45 + height * 0.55 }}
            />
          ))}
        </div>

        <div className="space-y-3 px-4 py-5">
          <div className="ml-8 rounded-2xl rounded-tr-md bg-ink px-3.5 py-2.5 text-sm text-paper">
            What’s a plain way to explain this to someone new on the team?
          </div>
          <div className="mr-6 rounded-2xl rounded-tl-md border border-line bg-panel-2 px-3.5 py-2.5 text-sm leading-relaxed">
            Start with the outcome they care about, then the one constraint that actually changes the plan.
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
          <span className="text-mute">The reply plays as soon as it’s ready.</span>
          <Link to="/register" className="font-semibold text-accent hover:text-accent-strong">
            Try a conversation
          </Link>
        </div>
      </div>
    </div>
  );
};

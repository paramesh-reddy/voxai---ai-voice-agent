import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MessageSquare, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { conversationsApi } from '../services/api';
import { Conversation } from '../types';
import { SUPPORTED_LANGUAGES, VOICE_PERSONAS } from '../utils/constants';

export const DashboardPage: React.FC = () => {
  const { user, settings } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await conversationsApi.list();
        setConversations(res.data);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadConversations();
  }, []);

  const totalExchanges = conversations.reduce((acc, c) => acc + (c.messageCount || 0), 0);
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === settings.language) || SUPPORTED_LANGUAGES[0];
  const currentVoice = VOICE_PERSONAS.find((v) => v.id === settings.defaultVoice) || VOICE_PERSONAS[0];
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  const suggestedPrompts = [
    { title: 'Explain it simply', prompt: 'Explain this as if I have ten minutes and no background in the topic.', tag: 'Explain' },
    { title: 'Practice the language', prompt: `Talk with me in ${currentLang.name}. Ask what I did this morning.`, tag: 'Practice' },
    { title: 'Work through an idea', prompt: 'Help me pressure-test a product idea. Ask one question at a time.', tag: 'Think' },
    { title: 'Something curious', prompt: 'Tell me one specific thing worth knowing from this week in science.', tag: 'Curious' },
  ];

  return (
    <AppShell
      title="Home"
      actions={
        <Link to="/assistant" className="btn btn-primary h-9 px-3 text-sm">
          <Mic className="h-4 w-4" strokeWidth={1.75} />
          Talk
        </Link>
      }
    >
      <section className="flex flex-col justify-between gap-6 border-b border-line pb-8 sm:flex-row sm:items-end">
        <div className="max-w-xl">
          <p className="text-sm text-mute">
            {currentLang.flag} {currentLang.name} · {currentVoice.name}
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-tight">Hello, {firstName}.</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-mute">
            The assistant is set to {currentVoice.name}. Start a new turn, or open something you already began.
          </p>
        </div>
        <Link to="/settings" className="btn btn-quiet">
          Change language or voice
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Conversations" value={String(conversations.length)} note="Saved on your account" />
        <Stat label="Turns" value={String(totalExchanges)} note="What you said, and the replies" />
        <Stat label="Voice" value={currentVoice.name} note={currentVoice.tag} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Start from a prompt</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestedPrompts.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => navigate('/assistant', { state: { prefillPrompt: item.prompt } })}
              className="card group p-4 text-left transition-colors hover:border-accent/50"
            >
              <p className="text-[13px] font-semibold text-accent">{item.tag}</p>
              <p className="mt-1 font-semibold">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-mute">{item.prompt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                Use this
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent</h3>
          <Link to="/history" className="text-sm font-semibold text-accent hover:text-accent-strong">
            All history
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-mute">Loading conversations…</p>
        ) : conversations.length === 0 ? (
          <div className="card flex flex-col items-start gap-3 p-6">
            <MessageSquare className="h-5 w-5 text-mute" strokeWidth={1.75} />
            <div>
              <p className="font-semibold">Nothing here yet</p>
              <p className="mt-1 max-w-md text-sm text-mute">Your first conversation will show up after you talk or send a message.</p>
            </div>
            <Link to="/assistant" className="btn btn-primary">
              <Mic className="h-4 w-4" strokeWidth={1.75} />
              Start one
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {conversations.slice(0, 5).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate('/assistant', { state: { conversationId: c.id } })}
                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-panel-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{c.title}</span>
                  <span className="block truncate text-sm text-mute">{c.lastMessage || 'No transcript yet.'}</span>
                </span>
                <span className="shrink-0 text-[13px] text-mute">{new Date(c.updatedAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
};

const Stat: React.FC<{ label: string; value: string; note: string }> = ({ label, value, note }) => (
  <div className="rounded-xl border border-line bg-panel px-4 py-4">
    <p className="text-sm text-mute">{label}</p>
    <p className="mt-1 font-display text-3xl tracking-tight">{value}</p>
    <p className="mt-1 text-[13px] text-mute">{note}</p>
  </div>
);

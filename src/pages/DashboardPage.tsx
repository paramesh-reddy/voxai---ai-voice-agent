import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { conversationsApi } from '../services/api';
import { Conversation } from '../types';
import { SUPPORTED_LANGUAGES, VOICE_PERSONAS } from '../utils/constants';
import {
  Mic,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Volume2,
  ChevronRight,
  Menu,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, theme, toggleTheme, settings } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const suggestedPrompts = [
    { title: 'Brainstorm Startup Ideas', prompt: 'Give me 3 unconventional AI startup ideas focused on speech technology.', tag: 'Strategy' },
    { title: 'Summarize Today in Tech', prompt: 'What are the most significant developments in generative voice synthesis this year?', tag: 'Research' },
    { title: 'Practice Language Dialogue', prompt: `Let us converse in ${currentLang.name}. Ask me what I did this morning.`, tag: 'Language' },
    { title: 'Explain Quantum Computing', prompt: 'Explain quantum entanglement simply as if I were a high school physics student.', tag: 'Education' },
  ];

  return (
    <div className="flex h-screen bg-[#080C14] light:bg-slate-50 text-slate-100 light:text-slate-900 transition-colors duration-200 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Header */}
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
              <span className="text-slate-200 light:text-slate-900 font-medium">Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
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

            <Link
              to="/assistant"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all whitespace-nowrap"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Voice Session</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Welcome Banner */}
          <div className="relative rounded-2xl border border-slate-800 light:border-slate-200 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/80 light:from-white light:via-indigo-50/50 light:to-white p-6 sm:p-8 overflow-hidden shadow-xl light:shadow-sm backdrop-blur-md">
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-cyan-300 light:text-indigo-600">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ready for live conversation · Language: {currentLang.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-slate-900">
                Welcome back, {user?.fullName?.split(' ')[0] || 'Friend'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 leading-relaxed">
                Your neural voice assistant is primed in {currentLang.name} with the {currentVoice.name} persona. Tap below to speak or practice conversation.
              </p>
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  to="/assistant"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-cyan-400 active:scale-95 transition-all"
                >
                  <Mic className="h-4 w-4" />
                  <span>Start Voice Interaction</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 light:border-slate-300 bg-slate-900/80 light:bg-slate-100 text-xs font-medium text-slate-200 light:text-slate-700 hover:bg-slate-800 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5 text-cyan-400 light:text-indigo-600" />
                  <span>Change Language ({currentLang.flag})</span>
                </Link>
              </div>
            </div>

            {/* Ambient Graphic Accent */}
            <div className="hidden sm:block absolute right-6 top-1/2 -translate-y-1/2 w-48 h-48 opacity-40 light:opacity-70 pointer-events-none">
              <img
                src="/src/assets/images/voxai_assistant_orb_1792906988899.jpg"
                alt="Voice Assistant Visual Orb"
                className="w-full h-full object-cover rounded-full shadow-2xl animate-pulse-subtle"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/50 light:bg-white p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 light:text-slate-500">
                <span>Total Conversations</span>
                <MessageSquare className="h-4 w-4 text-indigo-400 light:text-indigo-600" />
              </div>
              <p className="text-2xl font-bold font-mono text-white light:text-slate-900 tabular-nums">
                {conversations.length}
              </p>
              <p className="text-[11px] text-slate-500">Stored sessions in database</p>
            </div>

            <div className="rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/50 light:bg-white p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 light:text-slate-500">
                <span>Total Voice Exchanges</span>
                <Mic className="h-4 w-4 text-cyan-400 light:text-cyan-600" />
              </div>
              <p className="text-2xl font-bold font-mono text-white light:text-slate-900 tabular-nums">
                {totalExchanges}
              </p>
              <p className="text-[11px] text-slate-500">Transcribed turns & responses</p>
            </div>

            <div className="rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/50 light:bg-white p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 light:text-slate-500">
                <span>Active Language & Voice</span>
                <Globe className="h-4 w-4 text-emerald-400 light:text-emerald-600" />
              </div>
              <p className="text-base font-bold text-white light:text-slate-900 truncate">
                {currentLang.flag} {currentLang.name}
              </p>
              <p className="text-[11px] text-slate-500">{currentVoice.tag}</p>
            </div>
          </div>

          {/* Suggested Voice Prompts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 light:text-slate-900">Recommended Spoken Prompts</h2>
              <span className="text-xs text-slate-400 light:text-slate-500">Tap to start voice prompt</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {suggestedPrompts.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/assistant', { state: { prefillPrompt: item.prompt } })}
                  className="group cursor-pointer rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-white p-4 hover:border-indigo-500/40 light:hover:border-indigo-300 hover:bg-slate-800/60 light:hover:bg-slate-50 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 light:text-indigo-600 uppercase tracking-wider font-semibold">
                      {item.tag}
                    </span>
                    <h3 className="text-xs font-semibold text-slate-200 light:text-slate-900 group-hover:text-white light:group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 light:text-slate-500 line-clamp-2">
                      "{item.prompt}"
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 light:border-slate-100 flex items-center justify-between text-[11px] text-indigo-400 light:text-indigo-600 group-hover:text-cyan-300 light:group-hover:text-indigo-700">
                    <span>Ask VoxAI</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 light:text-slate-900">Recent Conversations</h2>
              <Link to="/history" className="text-xs font-medium text-cyan-400 light:text-indigo-600 hover:underline">
                View all history
              </Link>
            </div>

            {loading ? (
              <div className="rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-8 text-center text-xs text-slate-500">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-8 text-center space-y-3 shadow-xs">
                <MessageSquare className="h-8 w-8 mx-auto text-slate-600 light:text-slate-400" />
                <p className="text-xs font-medium text-slate-300 light:text-slate-800">No conversations recorded yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Start your first voice conversation to see intelligent contextual memory in action.
                </p>
                <div className="pt-2">
                  <Link
                    to="/assistant"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Launch Voice Assistant</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white divide-y divide-slate-800 light:divide-slate-200 overflow-hidden shadow-xs">
                {conversations.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate('/assistant', { state: { conversationId: c.id } })}
                    className="flex items-center justify-between p-4 hover:bg-slate-800/50 light:hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-indigo-950/60 light:bg-indigo-50 text-indigo-400 light:text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-800/30 light:border-indigo-200">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 light:text-slate-900 group-hover:text-white light:group-hover:text-indigo-600 truncate">
                          {c.title}
                        </p>
                        <p className="text-[11px] text-slate-400 light:text-slate-500 truncate max-w-md">
                          {c.lastMessage || 'No recent transcript.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-slate-400 light:text-slate-500">
                      <span className="text-[11px] text-slate-500 hidden sm:inline tabular-nums">
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 text-slate-500 group-hover:text-cyan-300 light:group-hover:text-indigo-600 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

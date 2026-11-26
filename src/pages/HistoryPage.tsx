import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { conversationsApi } from '../services/api';
import { Conversation, Message } from '../types';
import { VOICE_PERSONAS, SUPPORTED_LANGUAGES } from '../utils/constants';
import {
  Menu,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Volume2,
  Mic,
  ChevronRight,
  Bot,
  User,
  Sun,
  Moon,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { theme, toggleTheme, settings } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<(Conversation & { messages: Message[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Deletion modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await conversationsApi.list();
      setConversations(res.data);
      if (res.data.length > 0 && !selectedId) {
        selectConversation(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (id: string) => {
    setSelectedId(id);
    try {
      const res = await conversationsApi.get(id);
      setActiveConversation(res.data);
    } catch (err) {
      console.error('Failed to fetch conversation details:', err);
    }
  };

  const handleStartRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await conversationsApi.rename(id, editTitle.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c))
      );
      if (activeConversation && activeConversation.id === id) {
        setActiveConversation({ ...activeConversation, title: editTitle.trim() });
      }
      setEditingId(null);
    } catch (err) {
      console.error('Rename failed:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await conversationsApi.delete(deleteId);
      const remaining = conversations.filter((c) => c.id !== deleteId);
      setConversations(remaining);
      if (selectedId === deleteId) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          setSelectedId(null);
          setActiveConversation(null);
        }
      }
      setDeleteId(null);
    } catch (err) {
      console.error('Deletion failed:', err);
    }
  };

  const playSpeech = (text: string, audioUrl?: string) => {
    if (audioUrl) {
      const a = new Audio(audioUrl);
      a.playbackRate = settings.playbackSpeed || 1.0;
      a.play().catch(() => speakWithBrowserSpeech(text));
    } else {
      speakWithBrowserSpeech(text);
    }
  };

  const speakWithBrowserSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const currentVoiceObj = VOICE_PERSONAS.find((v) => v.id === settings.defaultVoice) || VOICE_PERSONAS[0];
    const u = new SpeechSynthesisUtterance(text);
    u.rate = settings.playbackSpeed || 1.0;
    u.pitch = currentVoiceObj.pitch || 1.15;
    u.lang = settings.language || 'en-US';
    window.speechSynthesis.speak(u);
  };

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#080C14] light:bg-slate-50 text-slate-100 light:text-slate-900 transition-colors duration-200 overflow-hidden">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 light:border-slate-200 bg-[#080C14]/90 light:bg-white/95 px-6 backdrop-blur-md transition-colors duration-200">
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
              <span className="text-slate-200 light:text-slate-900 font-medium">Conversation History</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </header>

        {/* Master-Detail Split Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Conversation List */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-slate-800 light:border-slate-200 flex flex-col h-full bg-[#080C14] light:bg-white">
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-800 light:border-slate-200">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 light:text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search past conversations..."
                  className="w-full rounded-lg border border-slate-700 light:border-slate-300 bg-slate-900/80 light:bg-slate-50 pl-9 pr-3 py-2 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 light:divide-slate-200">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading history...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No conversations match your search.
                </div>
              ) : (
                filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`p-4 cursor-pointer transition-colors group relative ${
                      selectedId === c.id
                        ? 'bg-indigo-950/30 light:bg-indigo-50/80 border-l-2 border-indigo-500'
                        : 'hover:bg-slate-900/50 light:hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {editingId === c.id ? (
                        <div
                          className="flex items-center gap-1.5 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="rounded bg-slate-800 light:bg-white px-2 py-1 text-xs text-white light:text-slate-900 border border-indigo-500 w-full"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(c.id)}
                            className="p-1 text-emerald-400 hover:bg-slate-700 light:hover:bg-slate-200 rounded"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-700 light:hover:bg-slate-200 rounded"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h4 className="text-xs font-semibold text-slate-200 light:text-slate-800 group-hover:text-white light:group-hover:text-indigo-600 line-clamp-1 flex-1">
                          {c.title}
                        </h4>
                      )}

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartRename(c, e)}
                          className="p-1 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 rounded"
                          title="Rename"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(c.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 light:text-slate-500 line-clamp-1 mt-1">
                      {c.lastMessage || 'No recent transcript.'}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                      <span>{c.messageCount || 0} messages</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Selected Conversation Viewer */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-[#080C14]/60 light:bg-slate-50/60 overflow-hidden">
            {activeConversation ? (
              <>
                {/* Active Conversation Header */}
                <div className="flex items-center justify-between border-b border-slate-800 light:border-slate-200 p-4 bg-slate-900/40 light:bg-white shadow-xs">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-white light:text-slate-900">{activeConversation.title}</h3>
                    <p className="text-[11px] text-slate-500">
                      Created {new Date(activeConversation.createdAt).toLocaleString()} · {activeConversation.messages?.length || 0} messages
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/assistant', { state: { conversationId: activeConversation.id } })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Continue Conversation</span>
                  </button>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {activeConversation.messages?.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-xs">
                      No messages recorded in this conversation yet.
                    </div>
                  ) : (
                    activeConversation.messages?.map((msg) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 text-xs leading-relaxed ${
                            isUser ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {!isUser && (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-950 light:bg-indigo-50 text-indigo-400 light:text-indigo-600 border border-indigo-800/40 light:border-indigo-200">
                              <Bot className="h-4 w-4" />
                            </div>
                          )}

                          <div
                            className={`group relative max-w-[80%] rounded-xl px-4 py-3 shadow-xs ${
                              isUser
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-slate-800/90 light:bg-white text-slate-200 light:text-slate-800 border border-slate-700/60 light:border-slate-200 rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-400 light:text-slate-500 border-t border-white/5 light:border-slate-100 pt-1.5">
                              <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                              {!isUser && (
                                <button
                                  onClick={() => playSpeech(msg.content, msg.audioDataUrl)}
                                  className="hover:text-cyan-300 light:hover:text-indigo-600 flex items-center gap-1 text-[11px]"
                                >
                                  <Volume2 className="h-3 w-3" />
                                  <span>Replay Speech</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {isUser && (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30 light:bg-indigo-100 text-indigo-300 light:text-indigo-700 border border-indigo-500/30 light:border-indigo-200">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
                <MessageSquare className="h-10 w-10 mb-2 stroke-1 text-slate-600 light:text-slate-400" />
                <p className="text-xs font-medium text-slate-400 light:text-slate-600">Select a conversation to review messages</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Deletion */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900 light:bg-white p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-white light:text-slate-900">Delete Conversation?</h3>
            <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
              This will permanently delete this conversation and all associated message turns. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 light:border-slate-300 text-xs text-slate-300 light:text-slate-700 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

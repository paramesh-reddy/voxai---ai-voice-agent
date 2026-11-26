import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MessageSquare, Mic, Pencil, Search, Trash2, Volume2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { conversationsApi } from '../services/api';
import { Conversation, Message } from '../types';
import { VOICE_PERSONAS } from '../utils/constants';
import { Mark } from '../components/brand/BrandMark';

export const HistoryPage: React.FC = () => {
  const { settings } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<(Conversation & { messages: Message[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
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
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c)));
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

  const speakWithBrowserSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const currentVoiceObj = VOICE_PERSONAS.find((v) => v.id === settings.defaultVoice) || VOICE_PERSONAS[0];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.playbackSpeed || 1.0;
    utterance.pitch = currentVoiceObj.pitch || 1.15;
    utterance.lang = settings.language || 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const playSpeech = (text: string, audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.playbackRate = settings.playbackSpeed || 1.0;
      audio.play().catch(() => speakWithBrowserSpeech(text));
    } else {
      speakWithBrowserSpeech(text);
    }
  };

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell title="History" padded={false}>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
        <div className="flex h-full flex-col border-r border-line md:col-span-5 lg:col-span-4">
          <div className="border-b border-line p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" strokeWidth={1.75} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations"
                className="field pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-6 text-sm text-mute">Loading history…</p>
            ) : filtered.length === 0 ? (
              <p className="p-6 text-sm text-mute">No conversations match that search.</p>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`cursor-pointer border-b border-line px-4 py-3.5 ${
                    selectedId === c.id ? 'bg-accent-soft' : 'hover:bg-panel-2'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {editingId === c.id ? (
                      <div className="flex flex-1 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="field py-1"
                          autoFocus
                        />
                        <button type="button" onClick={() => handleSaveRename(c.id)} className="icon-btn" aria-label="Save name">
                          <Check className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="icon-btn" aria-label="Cancel rename">
                          <X className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className="line-clamp-1 flex-1 text-sm font-semibold">{c.title}</h4>
                        <button type="button" onClick={(e) => handleStartRename(c, e)} className="icon-btn h-7 w-7" aria-label="Rename">
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(c.id);
                          }}
                          className="icon-btn h-7 w-7 hover:text-danger"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-mute">{c.lastMessage || 'No transcript yet.'}</p>
                  <p className="mt-1.5 text-[12px] text-mute">
                    {new Date(c.updatedAt).toLocaleDateString()} · {c.messageCount || 0} messages
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex h-full flex-col overflow-hidden md:col-span-7 lg:col-span-8">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{activeConversation.title}</h3>
                  <p className="text-sm text-mute">
                    {new Date(activeConversation.createdAt).toLocaleString()} · {activeConversation.messages?.length || 0} messages
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/assistant', { state: { conversationId: activeConversation.id } })}
                  className="btn btn-primary h-9 shrink-0 px-3 text-sm"
                >
                  <Mic className="h-4 w-4" strokeWidth={1.75} />
                  Continue
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {activeConversation.messages?.length === 0 ? (
                  <p className="py-16 text-center text-sm text-mute">No messages in this conversation yet.</p>
                ) : (
                  activeConversation.messages?.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={msg.id} className={`flex gap-2.5 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {!isUser && <Mark className="h-7 w-7 shrink-0 rounded-md" />}
                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${isUser ? 'rounded-tr-md bg-ink text-paper' : 'rounded-tl-md border border-line bg-panel'}`}>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <div className={`mt-2 flex items-center justify-between gap-3 text-[12px] ${isUser ? 'text-paper/70' : 'text-mute'}`}>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {!isUser && (
                              <button type="button" onClick={() => playSpeech(msg.content, msg.audioDataUrl)} className="inline-flex items-center gap-1 hover:text-ink">
                                <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                                Play
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-mute">
              <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
              <p className="text-sm">Choose a conversation to read it.</p>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-sm p-5">
            <h3 className="font-display text-2xl">Delete this conversation?</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">The transcript goes with it. This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteId(null)} className="btn btn-quiet">
                Keep it
              </button>
              <button type="button" onClick={handleConfirmDelete} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

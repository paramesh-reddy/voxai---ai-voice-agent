import React, { useEffect, useRef } from 'react';
import { Message } from '../../types';
import { User, Bot, Volume2, Copy, Check, Mic, Terminal } from 'lucide-react';

interface TranscriptPanelProps {
  messages: Message[];
  onPlaySpeech: (text: string, audioUrl?: string) => void;
  isSpeaking: boolean;
  onClear: () => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  messages,
  onPlaySpeech,
  isSpeaking,
  onClear,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-white backdrop-blur-md overflow-hidden shadow-xs transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 light:border-slate-200 px-5 py-3.5 bg-slate-900/90 light:bg-slate-50/90">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400 light:text-indigo-600" />
          <h3 className="text-xs font-semibold text-slate-200 light:text-slate-800 uppercase tracking-wider">
            Conversation Transcript
          </h3>
          <span className="text-[11px] text-slate-400 light:text-slate-500">({messages.length} turns)</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 light:text-slate-500 hover:text-rose-400 transition-colors"
          >
            Clear Session
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
            <Mic className="h-8 w-8 mb-2 stroke-1 text-slate-600 light:text-slate-400" />
            <p className="text-xs font-medium text-slate-400 light:text-slate-600">No voice messages in this session yet</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Tap the microphone to speak, or type below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
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
                  className={`group relative max-w-[85%] rounded-xl px-4 py-3 shadow-xs ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                      : 'bg-slate-800/90 light:bg-slate-100 text-slate-200 light:text-slate-800 border border-slate-700/60 light:border-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-400 light:text-slate-500 border-t border-white/5 light:border-slate-200 pt-1.5">
                    <span className="flex items-center gap-1 opacity-70">
                      {isUser && msg.inputType === 'voice' && <Mic className="h-3 w-3 text-cyan-300 light:text-cyan-600" />}
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isUser && (
                        <button
                          onClick={() => onPlaySpeech(msg.content, msg.audioDataUrl)}
                          className="hover:text-cyan-300 light:hover:text-indigo-600 p-0.5 rounded transition-colors"
                          title="Replay Voice Audio"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.content)}
                        className="hover:text-cyan-300 light:hover:text-indigo-600 p-0.5 rounded transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
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
    </div>
  );
};

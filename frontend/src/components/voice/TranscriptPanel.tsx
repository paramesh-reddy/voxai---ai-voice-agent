import React, { useEffect, useRef } from 'react';
import { Check, Copy, Mic, Volume2 } from 'lucide-react';
import { Message } from '../../types';
import { Mark } from '../brand/BrandMark';

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
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Transcript</h3>
          <p className="text-[13px] text-mute">
            {messages.length} {messages.length === 1 ? 'turn' : 'turns'}
            {isSpeaking ? ' · speaking' : ''}
          </p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={onClear} className="text-sm text-mute hover:text-danger">
            New thread
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-mute">
            <Mic className="mb-2 h-5 w-5" strokeWidth={1.75} />
            <p className="text-sm">This thread is empty.</p>
            <p className="mt-1 text-sm">Talk, or type a line, and it will land here.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-2.5 text-sm leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && <Mark className="h-7 w-7 shrink-0 rounded-md" />}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${isUser ? 'rounded-tr-md bg-ink text-paper' : 'rounded-tl-md border border-line bg-panel-2'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <div className={`mt-2 flex items-center justify-between gap-3 text-[12px] ${isUser ? 'text-paper/70' : 'text-mute'}`}>
                    <span className="inline-flex items-center gap-1">
                      {isUser && msg.inputType === 'voice' && <Mic className="h-3 w-3" strokeWidth={1.75} />}
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => onPlaySpeech(msg.content, msg.audioDataUrl)}
                          className="rounded p-0.5 hover:text-ink"
                          title="Play again"
                        >
                          <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.id, msg.content)}
                        className="rounded p-0.5 hover:text-ink"
                        title="Copy"
                      >
                        {copiedId === msg.id ? <Check className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cancelStreaming, sendMessage } from '@/features/chat/chatSlice';
import { Spinner } from '@/components/ui/Spinner';

const SUGGESTIONS = [
  'Show me electric SUVs under $50,000',
  'Which of these has the best range?',
  'Open the cheapest one and tell me its pros and cons',
  'Compare the BMW X5 and Audi Q7',
];

export function ChatComposer() {
  const dispatch = useAppDispatch();
  const isStreaming = useAppSelector((s) => s.chat.isStreaming);
  const messages = useAppSelector((s) => s.chat.messages);
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 144) + 'px';
    }
  }, [text]);

  const handleSubmit = () => {
    if (!text.trim() || isStreaming) return;
    void dispatch(sendMessage(text));
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Only show suggestions when there's just the welcome message
  const showSuggestions = messages.length === 1;

  return (
    <div className="border-t border-slate-200 bg-white px-3 py-3">
      {showSuggestions && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void dispatch(sendMessage(s))}
              disabled={isStreaming}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about cars, apply filters, or compare options…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-400"
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={() => cancelStreaming()}
            className="grid h-9 w-9 place-items-center rounded-lg bg-red-600 text-white hover:bg-red-700"
            aria-label="Stop"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-white shadow hover:bg-brand-700 disabled:opacity-40"
            aria-label="Send"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
        <span>Enter to send · Shift+Enter for newline</span>
        {isStreaming && (
          <span className="flex items-center gap-1">
            <Spinner size={10} />
            Streaming…
          </span>
        )}
      </div>
    </div>
  );
}

import type { ChatMessage as ChatMessageT } from '@/types/chat';
import { ToolCallBadge } from './ToolCallBadge';
import { cn } from '@/utils/format';

export function ChatMessage({ message }: { message: ChatMessageT }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex w-full animate-slide-up', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[92%] gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
        <Avatar role={message.role} />
        <div
          className={cn(
            'min-w-0 space-y-2',
            isUser ? 'items-end text-right' : 'items-start text-left',
          )}
        >
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="space-y-1.5">
              {message.toolCalls.map((tc) => (
                <ToolCallBadge key={tc.id} trace={tc} />
              ))}
            </div>
          )}

          {(message.content || message.pending) && (
            <div
              className={cn(
                'inline-block rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
                isUser
                  ? 'bg-brand-600 text-white rounded-br-md'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md',
              )}
            >
              <div className="whitespace-pre-wrap break-words text-left">
                {message.content || (message.pending ? <TypingDots /> : null)}
                {message.pending && message.content && <TypingCursor />}
              </div>
            </div>
          )}

          {message.error && (
            <div className="inline-block rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
              {message.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  if (role === 'user') {
    return (
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
        You
      </div>
    );
  }
  return (
    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <rect x="3" y="7" width="18" height="13" rx="2.5" />
        <path d="M8 7V5a4 4 0 0 1 8 0v2" />
        <circle cx="9" cy="13.5" r="1" fill="currentColor" />
        <circle cx="15" cy="13.5" r="1" fill="currentColor" />
      </svg>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-slate-400" />
      <span
        className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-slate-400"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-slate-400"
        style={{ animationDelay: '300ms' }}
      />
    </span>
  );
}

function TypingCursor() {
  return <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-current align-middle" />;
}

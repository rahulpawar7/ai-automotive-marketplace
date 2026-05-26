import { useState } from 'react';
import type { ToolCallTrace } from '@/types/chat';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/format';

interface ToolCallBadgeProps {
  trace: ToolCallTrace;
}

const friendlyNames: Record<string, string> = {
  search_catalog: 'Searching catalog',
  filter_cars: 'Filtering cars',
  update_ui: 'Updating UI',
  get_car_details: 'Fetching car details',
  mock_get_live_pricing: 'Checking live pricing',
};

const progressVerb: Record<string, string> = {
  search_catalog: 'Searched catalog',
  filter_cars: 'Filtered cars',
  update_ui: 'Updated UI',
  get_car_details: 'Fetched car details',
  mock_get_live_pricing: 'Checked live pricing',
};

export function ToolCallBadge({ trace }: ToolCallBadgeProps) {
  const [open, setOpen] = useState(false);
  const isRunning = trace.status === 'running';
  const isError = trace.status === 'error';

  return (
    <div
      className={cn(
        'rounded-lg border text-xs',
        isError
          ? 'border-red-200 bg-red-50'
          : isRunning
            ? 'border-brand-200 bg-brand-50'
            : 'border-slate-200 bg-slate-50',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5"
      >
        <span className="flex items-center gap-2">
          {isRunning ? (
            <Spinner size={12} className="text-brand-600" />
          ) : isError ? (
            <span className="grid h-3 w-3 place-items-center rounded-full bg-red-500 text-white">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          ) : (
            <span className="grid h-3 w-3 place-items-center rounded-full bg-emerald-500 text-white">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
          <span className="font-medium">
            {isRunning
              ? `${friendlyNames[trace.name] ?? trace.name}…`
              : progressVerb[trace.name] ?? trace.name}
          </span>
        </span>
        <span className="text-slate-400 text-[10px]">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="border-t border-slate-200 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-slate-600">
          <div className="mb-1 uppercase tracking-wide text-slate-400">Arguments</div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(trace.args, null, 2)}
          </pre>
          {trace.result !== undefined && (
            <>
              <div className="mt-2 mb-1 uppercase tracking-wide text-slate-400">Result</div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all">
                {truncate(JSON.stringify(trace.result, null, 2), 600)}
              </pre>
            </>
          )}
          {trace.error && (
            <>
              <div className="mt-2 mb-1 uppercase tracking-wide text-red-500">Error</div>
              <pre className="whitespace-pre-wrap text-red-600">{trace.error}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

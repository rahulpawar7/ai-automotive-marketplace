import { useEffect, type ReactNode } from 'react';
import { cn } from '@/utils/format';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /**
   * Drawer header title. Pass `null` to render the drawer with NO header at all
   * (useful when the child has its own header — avoids duplicate `<h2>` nodes).
   */
  title?: string | null;
  children: ReactNode;
  widthClass?: string;
  ariaLabel?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  widthClass = 'max-w-2xl',
  ariaLabel,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const showHeader = title !== null && title !== undefined;

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 transition-opacity',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className={cn(
          'absolute right-0 top-0 h-full w-full bg-white shadow-2xl transition-transform duration-300 ease-out',
          widthClass,
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      >
        <div className="flex h-full flex-col">
          {showHeader && (
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>
          )}
          <div className="flex-1 overflow-y-auto scroll-thin">{children}</div>
        </div>
      </aside>
    </div>
  );
}

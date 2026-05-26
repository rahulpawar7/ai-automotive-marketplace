import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

interface ChipProps {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
  variant?: 'default' | 'brand' | 'success' | 'warning';
}

const variants = {
  default: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-800',
};

export function Chip({ children, onRemove, className, variant = 'default' }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-black/10"
          aria-label="Remove"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
}

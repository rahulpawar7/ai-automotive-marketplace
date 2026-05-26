import { useEffect, useState } from 'react';

/**
 * Returns true while the given media query matches.
 * Safe for SSR (returns false on the server pass).
 *
 * Used to guarantee components like the chat panel are mounted in EXACTLY
 * one place — not in two viewports' worth of layout simultaneously.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Convenience: matches Tailwind's `lg` breakpoint (≥1024px). */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

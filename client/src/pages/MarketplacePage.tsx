import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadCars, loadFacets } from '@/features/marketplace/marketplaceSlice';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { Header } from '@/components/layout/Header';
import { FiltersPanel } from '@/components/filters/FiltersPanel';
import { CarGrid } from '@/components/cars/CarGrid';
import { CarDetailDrawer } from '@/components/cars/CarDetailDrawer';
import { ActiveFilters } from '@/components/cars/ActiveFilters';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Drawer } from '@/components/ui/Drawer';

export default function MarketplacePage() {
  const dispatch = useAppDispatch();
  const isStreaming = useAppSelector((s) => s.chat.isStreaming);
  const isDesktop = useIsDesktop();
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    void dispatch(loadFacets());
    void dispatch(loadCars());
  }, [dispatch]);

  // Auto-open mobile chat when the agent starts working, so the user sees
  // streaming tokens + tool-call traces even if they triggered the agent
  // from outside the chat (e.g. by tapping a suggestion).
  useEffect(() => {
    if (isStreaming && !isDesktop) setMobileChatOpen(true);
  }, [isStreaming, isDesktop]);

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50">
      <Header />

      <main className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(320px,1fr)]">
        {/* LEFT — browse area (~75% on desktop) */}
        <section className="flex min-h-0 flex-col overflow-y-auto scroll-thin">
          <div className="mx-auto w-full max-w-screen-2xl px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
            {/* Mobile-only quick-action row */}
            {!isDesktop && (
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="btn-secondary"
                >
                  <FilterIcon />
                  Filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-6">
              {isDesktop && (
                <aside aria-label="Filters">
                  <FiltersPanel />
                </aside>
              )}
              <div className="min-w-0">
                <div className="mb-4">
                  <ActiveFilters />
                </div>
                <CarGrid />

                {/* Spacer so the floating chat button doesn't sit on the last card on mobile */}
                {!isDesktop && <div className="h-20" aria-hidden="true" />}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT — chat panel (~25% on desktop). Mounted only at desktop widths. */}
        {isDesktop && (
          <aside aria-label="AI shopping assistant" className="min-h-0 border-l border-slate-200">
            <ChatPanel />
          </aside>
        )}
      </main>

      {/* Mobile floating button */}
      {!isDesktop && (
        <button
          type="button"
          onClick={() => setMobileChatOpen(true)}
          className="fixed bottom-4 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 active:scale-95 transition-all"
          aria-label="Open AI assistant"
        >
          <ChatBubbleIcon />
          {isStreaming && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-emerald-400 ring-2 ring-white" />
          )}
        </button>
      )}

      {/*
        Mobile chat drawer — content only mounted while open (single ChatPanel
        guarantee). title={null} because ChatPanel already renders its own
        header with a close button on mobile — avoids duplicate <h2>s.
      */}
      <Drawer
        open={mobileChatOpen && !isDesktop}
        onClose={() => setMobileChatOpen(false)}
        title={null}
        ariaLabel="AI Shopping Assistant"
        widthClass="max-w-md"
      >
        {mobileChatOpen && !isDesktop && (
          <div className="h-full">
            <ChatPanel onClose={() => setMobileChatOpen(false)} />
          </div>
        )}
      </Drawer>

      {/* Mobile filters drawer */}
      <Drawer
        open={mobileFiltersOpen && !isDesktop}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
        widthClass="max-w-sm"
      >
        {mobileFiltersOpen && !isDesktop && (
          <div className="p-4">
            <FiltersPanel />
          </div>
        )}
      </Drawer>

      <CarDetailDrawer />
    </div>
  );
}

function FilterIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

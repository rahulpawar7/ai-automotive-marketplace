import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loggedOut } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/Button';

export function Header() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17h14M5 17l2-6h10l2 6M5 17v3M19 17v3M7 11l1.5-4.5a2 2 0 0 1 1.9-1.5h3.2a2 2 0 0 1 1.9 1.5L17 11" />
              <circle cx="8" cy="17" r="1.5" />
              <circle cx="16" cy="17" r="1.5" />
            </svg>
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">AutoMarket</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              AI-Powered Shopping
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Visible on all viewports; shrinks on narrow screens but stays present. */}
              <span className="max-w-[120px] truncate text-xs text-slate-600 sm:max-w-none sm:text-sm">
                Hi,{' '}
                <span className="font-medium text-slate-800">
                  {user.name.split(' ')[0]}
                </span>
              </span>
              <Button
                variant="secondary"
                onClick={() => {
                  dispatch(loggedOut());
                  navigate('/login');
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-xs sm:text-sm">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary text-xs sm:text-sm">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

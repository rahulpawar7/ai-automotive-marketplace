import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { register as registerThunk } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  const error = useAppSelector((s) => s.auth.error);
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(registerThunk({ name, email, password }));
    if (registerThunk.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-slate-900 via-brand-900 to-brand-700 p-12 text-white">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 17h14M5 17l2-6h10l2 6M5 17v3M19 17v3" />
              <circle cx="8" cy="17" r="1.5" />
              <circle cx="16" cy="17" r="1.5" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight">AutoMarket</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Create your shopping account.
          </h2>
          <p className="mt-3 text-brand-50/90">
            We use accounts to remember your preferences and chat history across
            sessions. Authentication is optional — guest browsing works too.
          </p>
        </div>
        <div className="text-sm text-brand-100/80">
          Already part of AutoMarket? Just sign in.
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            It takes a few seconds. No credit card required.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="register-name" className="label">
                Name
              </label>
              <input
                id="register-name"
                type="text"
                required
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="register-email" className="label">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="register-password" className="label">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                required
                minLength={8}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="mt-1 text-[11px] text-slate-500">At least 8 characters.</p>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Spinner size={14} />} Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-slate-400">
            Or{' '}
            <Link to="/" className="font-medium underline hover:text-slate-600">
              continue as guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

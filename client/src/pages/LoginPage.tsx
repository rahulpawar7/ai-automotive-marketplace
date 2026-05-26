import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  const error = useAppSelector((s) => s.auth.error);
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sign in to save filters and chat history.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="login-email" className="label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="label">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Spinner size={14} />} Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create one
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-slate-400">
        Or{' '}
        <Link to="/" className="font-medium underline hover:text-slate-600">
          continue as guest
        </Link>
      </p>
    </AuthLayout>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-12 text-white">
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
            Buy your next car with an AI co-pilot.
          </h2>
          <p className="mt-3 text-brand-50/90">
            Browse, filter and compare hundreds of cars while a tool-using AI
            agent helps you cut through the noise. Built on retrieval-augmented
            grounding so answers stay honest.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3 text-sm">
          <Feature>Semantic search</Feature>
          <Feature>Tool-driven UI</Feature>
          <Feature>RAG-grounded answers</Feature>
          <Feature>Streaming chat</Feature>
        </ul>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {children}
    </li>
  );
}

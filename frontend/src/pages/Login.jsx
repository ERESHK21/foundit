import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../lib/api';

const DEMOS = [
  { label: 'Student', email: 'aarav@campus.edu', hint: 'claim a found item' },
  { label: 'Desk staff', email: 'staff@foundit.dev', hint: 'review the queue' },
  { label: 'Admin', email: 'admin@foundit.dev', hint: 'full access' },
];

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  function fill(email) {
    setForm({ email, password: 'Password123!' });
    setError('');
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${data.name.split(' ')[0]}`);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Could not sign in'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-900">
            F
          </span>
          <h1 className="mt-10 max-w-md text-4xl font-bold leading-tight">
            The lost-and-found desk, minus the queue.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Report what you lost, hand in what you found, and let blind claim verification decide who really owns it.
          </p>
        </div>
        <ul className="relative space-y-4 text-sm text-slate-300">
          {[
            ['Private details stay private', 'Only the reporter and desk staff ever see the hidden detail.'],
            ['Explainable match scores', 'Every claim gets a 0-100 confidence score and a reason label.'],
            ['A real verification trail', 'Approve, reject, notify, and mark items returned.'],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                ✓
              </span>
              <span>
                <strong className="font-semibold text-white">{title}.</strong> {body}
              </span>
            </li>
          ))}
        </ul>
        <p className="relative text-xs text-slate-500">FoundIt · Spring Boot + React capstone</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">
              F
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
              Create an account
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Campus email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@campus.edu"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </div>

            {error ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">{error}</p>
            ) : null}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Demo accounts</p>
            <p className="mt-1 text-xs text-slate-500">
              Password for all seeded users: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">Password123!</code>
            </p>
            <div className="mt-3 grid gap-2">
              {DEMOS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => fill(demo.email)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-xs transition hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <span>
                    <span className="font-semibold text-slate-800">{demo.label}</span>
                    <span className="ml-2 text-slate-500">{demo.hint}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{demo.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

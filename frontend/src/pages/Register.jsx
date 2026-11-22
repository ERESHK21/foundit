import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../lib/api';

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await register({ ...form, email: form.email.trim() });
      toast.success(`Account created — welcome, ${data.name.split(' ')[0]}`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Could not create your account'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="relative">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-900">
            F
          </span>
          <h1 className="mt-10 max-w-md text-4xl font-bold leading-tight">One desk for everything the campus loses.</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Join with your campus email. Report lost items, hand in found ones, and claim what is yours with proof only the
            real owner could know.
          </p>
        </div>
        <div className="relative grid gap-3 text-sm">
          {[
            ['📸', 'Photo + private detail', 'Attach a photo and one detail only the owner would recognise.'],
            ['🧮', 'Match score', 'Claims are ranked by how well they describe the private detail.'],
            ['🔔', 'Notifications', 'Get told the moment a claim is decided.'],
          ].map(([icon, title, body]) => (
            <div key={title} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="text-lg">{icon}</span>
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-xs text-slate-400">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="relative text-xs text-slate-500">FoundIt · Spring Boot + React capstone</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-5 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className="input"
                placeholder="Meera Nair"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
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
                placeholder="At least 6 characters"
                minLength={6}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </div>

            {error ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">{error}</p>
            ) : null}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
            <p className="text-center text-xs text-slate-400">
              Staff accounts are promoted by an admin after sign-up.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { initials, relativeTime } from '../lib/format';

const navLink = ({ isActive }) =>
  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

export default function Navbar() {
  const { user, isStaff, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inbox, setInbox] = useState({ items: [], unread: 0 });
  const panelRef = useRef(null);

  async function loadInbox() {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setInbox(data);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadInbox();
  }, [user]);

  useEffect(() => {
    function onClick(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function openPanel() {
    setOpen((value) => !value);
    if (!open) loadInbox();
  }

  async function markRead(id) {
    try {
      const { data } = await api.post(`/notifications/${id}/read`);
      setInbox(data);
    } catch {
      /* ignore */
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
            F
          </span>
          <span className="text-[17px] font-bold tracking-tight text-slate-900">
            Found<span className="text-indigo-600">It</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-0.5 md:flex">
          <NavLink to="/" end className={navLink}>
            Browse
          </NavLink>
          <NavLink to="/report" className={navLink}>
            Report
          </NavLink>
          {user ? (
            <>
              <NavLink to="/my/reports" className={navLink}>
                My reports
              </NavLink>
              <NavLink to="/my/claims" className={navLink}>
                My claims
              </NavLink>
            </>
          ) : null}
          {isStaff ? (
            <NavLink to="/desk" className={navLink}>
              Claim desk
            </NavLink>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {user ? (
            <div className="relative" ref={panelRef}>
              <button
                type="button"
                onClick={openPanel}
                className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Notifications"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
                {inbox.unread > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {inbox.unread}
                  </span>
                ) : null}
              </button>

              {open ? (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-800">Notifications</span>
                    <span className="text-xs text-slate-400">{inbox.unread} unread</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {inbox.items.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing here yet.</p>
                    ) : (
                      inbox.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => markRead(item.id)}
                          className={`block w-full border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                            item.read ? '' : 'bg-indigo-50/40'
                          }`}
                        >
                          <p className="text-sm font-medium text-slate-800">{item.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.body}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{relativeTime(item.createdAt)}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 py-1 pl-1 pr-3 sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                  {initials(user.name)}
                </span>
                <div className="leading-tight">
                  <p className="max-w-28 truncate text-xs font-semibold text-slate-800">{user.name}</p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">{user.role}</p>
                </div>
              </div>
              <button type="button" onClick={handleLogout} className="btn-ghost px-3 py-2 text-xs">
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost px-3 py-2 text-xs">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary px-3 py-2 text-xs">
                Join
              </Link>
            </div>
          )}
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 md:hidden">
        <NavLink to="/" end className={navLink}>
          Browse
        </NavLink>
        <NavLink to="/report" className={navLink}>
          Report
        </NavLink>
        {user ? (
          <>
            <NavLink to="/my/reports" className={navLink}>
              My reports
            </NavLink>
            <NavLink to="/my/claims" className={navLink}>
              My claims
            </NavLink>
          </>
        ) : null}
        {isStaff ? (
          <NavLink to="/desk" className={navLink}>
            Claim desk
          </NavLink>
        ) : null}
      </nav>
    </header>
  );
}

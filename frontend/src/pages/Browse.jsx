import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import Empty from '../components/Empty';
import ItemCard from '../components/ItemCard';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

const EMPTY_PAGE = { content: [], page: 0, totalPages: 0, totalElements: 0 };

export default function Browse() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ type: '', category: '', status: '', q: '' });
  const [page, setPage] = useState(0);
  const [data, setData] = useState(EMPTY_PAGE);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/categories')
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = { page, size: 12 };
        if (filters.type) params.type = filters.type;
        if (filters.category) params.category = filters.category;
        if (filters.status) params.status = filters.status;
        if (filters.q.trim()) params.q = filters.q.trim();
        const { data: result } = await api.get('/items', { params });
        if (active) setData(result);
      } catch {
        if (active) setData(EMPTY_PAGE);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters, page]);

  function updateFilter(patch) {
    setPage(0);
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-9 text-white sm:px-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Campus lost &amp; found</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
            Lost something? Someone probably handed it in.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Search the desk, then open a claim. Private details are checked by staff — not by whoever claims first.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                value={filters.q}
                onChange={(event) => updateFilter({ q: event.target.value })}
                placeholder="Search by name, description or place…"
                className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-10 pr-3 text-sm text-white outline-none backdrop-blur placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white/15"
              />
            </div>
            {user ? (
              <Link to="/report" className="btn-accent shrink-0">
                + Report an item
              </Link>
            ) : (
              <Link to="/register" className="btn-accent shrink-0">
                Join the desk
              </Link>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {data.totalElements} item{data.totalElements === 1 ? '' : 's'} listed
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Blind claim verification</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Updated live</span>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {[
              ['', 'All'],
              ['LOST', 'Lost'],
              ['FOUND', 'Found'],
            ].map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => updateFilter({ type: value })}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  filters.type === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            className="input !w-auto !py-2 text-sm"
            value={filters.category}
            onChange={(event) => updateFilter({ category: event.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="input !w-auto !py-2 text-sm"
            value={filters.status}
            onChange={(event) => updateFilter({ status: event.target.value })}
          >
            <option value="">Any status</option>
            <option value="OPEN">Open</option>
            <option value="CLAIMED">Claimed</option>
            <option value="RETURNED">Returned</option>
          </select>

          {(filters.type || filters.category || filters.status || filters.q) && (
            <button
              type="button"
              className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              onClick={() => {
                setPage(0);
                setFilters({ type: '', category: '', status: '', q: '' });
              }}
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-slate-500">{loading ? 'Searching…' : `${data.totalElements} result(s)`}</span>
        </div>
      </section>

      {loading && data.content.length === 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card h-56 animate-pulse bg-white p-4">
              <div className="h-10 w-10 rounded-xl bg-slate-100" />
              <div className="mt-4 h-3.5 w-2/3 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-full rounded bg-slate-50" />
              <div className="mt-1.5 h-3 w-4/5 rounded bg-slate-50" />
            </div>
          ))}
        </div>
      ) : data.content.length === 0 ? (
        <Empty
          icon="🔍"
          title="Nothing matches that search"
          hint="Try a different keyword, or clear the filters. New reports show up here instantly."
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

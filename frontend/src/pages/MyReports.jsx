import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiError } from '../lib/api';
import Empty from '../components/Empty';
import { StatusBadge, TypeBadge } from '../components/Badges';
import Pagination from '../components/Pagination';
import { categoryEmoji, fmtDate } from '../lib/format';

const EMPTY_PAGE = { content: [], totalPages: 0, totalElements: 0 };

export default function MyReports() {
  const [data, setData] = useState(EMPTY_PAGE);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data: result } = await api.get('/my/items', { params: { page, size: 10 } });
      setData(result);
    } catch (err) {
      toast.error(apiError(err, 'Could not load your reports'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  async function remove(id) {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await api.delete(`/items/${id}`);
      toast.success('Report deleted');
      load();
    } catch (err) {
      toast.error(apiError(err, 'Could not delete this report'));
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Your activity</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">My reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.totalElements} report{data.totalElements === 1 ? '' : 's'} · items you lost or handed in
          </p>
        </div>
        <Link to="/report" className="btn-primary">
          + New report
        </Link>
      </header>

      {loading ? (
        <div className="card h-40 animate-pulse" />
      ) : data.content.length === 0 ? (
        <Empty
          icon="📝"
          title="No reports yet"
          hint="Lost your keys, or picked up someone's ID card? File the first report and it appears on the desk instantly."
          action={
            <Link to="/report" className="btn-accent mt-2">
              Report an item
            </Link>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {data.content.map((item) => (
            <div key={item.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                {categoryEmoji(item.category)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/items/${item.id}`} className="truncate text-sm font-semibold text-slate-900 hover:text-indigo-700">
                    {item.title}
                  </Link>
                  <TypeBadge type={item.type} />
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.claimCount} claim{item.claimCount === 1 ? '' : 's'} · {item.locationName || 'Campus'} ·{' '}
                  {fmtDate(item.eventDate)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link to={`/items/${item.id}`} className="btn-ghost px-3 py-2 text-xs">
                  View
                </Link>
                {item.status === 'OPEN' && item.claimCount === 0 ? (
                  <button type="button" onClick={() => remove(item.id)} className="btn-ghost px-3 py-2 text-xs text-rose-600 hover:bg-rose-50">
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

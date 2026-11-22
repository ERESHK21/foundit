import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiError } from '../lib/api';
import Empty from '../components/Empty';
import Pagination from '../components/Pagination';
import { ScoreBar, StatusBadge } from '../components/Badges';
import { categoryEmoji, relativeTime } from '../lib/format';

const EMPTY_PAGE = { content: [], totalPages: 0, totalElements: 0 };

export default function MyClaims() {
  const [data, setData] = useState(EMPTY_PAGE);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data: result } = await api.get('/my/claims', { params: { page, size: 10 } });
      setData(result);
    } catch (err) {
      toast.error(apiError(err, 'Could not load your claims'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  async function withdraw(id) {
    if (!window.confirm('Withdraw this claim?')) return;
    try {
      await api.delete(`/claims/${id}`);
      toast.success('Claim withdrawn');
      load();
    } catch (err) {
      toast.error(apiError(err, 'Could not withdraw the claim'));
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Your activity</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">My claims</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every claim you opened, with the confidence score the desk uses to prioritise reviews.
        </p>
      </header>

      {loading ? (
        <div className="card h-40 animate-pulse" />
      ) : data.content.length === 0 ? (
        <Empty
          icon="🙋"
          title="You haven't claimed anything yet"
          hint="Found your item in the listing? Open it and describe the private detail only the real owner would know."
          action={
            <Link to="/" className="btn-accent mt-2">
              Browse the desk
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.content.map((claim) => (
            <div key={claim.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                    {categoryEmoji(claim.itemTitle)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/items/${claim.itemId}`}
                      className="block truncate text-sm font-semibold text-slate-900 hover:text-indigo-700"
                    >
                      {claim.itemTitle}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">Submitted {relativeTime(claim.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={claim.status} />
                  {claim.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => withdraw(claim.id)}
                      className="text-xs font-semibold text-slate-500 hover:text-rose-600"
                    >
                      Withdraw
                    </button>
                  ) : null}
                </div>
              </div>

              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm italic text-slate-600">“{claim.message}”</p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="min-w-40 flex-1">
                  <ScoreBar score={claim.matchScore} />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {claim.matchScore}% match · {claim.matchLabel}
                </span>
                {claim.decisionNote ? (
                  <span className="text-xs text-slate-500">Desk note: {claim.decisionNote}</span>
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

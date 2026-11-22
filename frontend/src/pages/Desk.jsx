import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiError } from '../lib/api';
import { ScoreBadge, ScoreBar, StatusBadge } from '../components/Badges';
import Empty from '../components/Empty';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { categoryEmoji, fmtDateTime, relativeTime } from '../lib/format';

const EMPTY_PAGE = { content: [], totalPages: 0, totalElements: 0 };

const TABS = [
  ['PENDING', 'Pending'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Rejected'],
  ['', 'All claims'],
];

export default function Desk() {
  const [tab, setTab] = useState('PENDING');
  const [page, setPage] = useState(0);
  const [claims, setClaims] = useState(EMPTY_PAGE);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (tab) params.status = tab;
      const [claimsResponse, statsResponse] = await Promise.all([
        api.get('/claims', { params }),
        api.get('/admin/stats'),
      ]);
      setClaims(claimsResponse.data);
      setStats(statsResponse.data);
    } catch (err) {
      toast.error(apiError(err, 'Could not load the claim desk'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tab, page]);

  async function decide() {
    if (!review) return;
    setBusy(true);
    try {
      await api.post(`/claims/${review.claim.id}/${review.mode}`, { note: note || null });
      toast.success(review.mode === 'approve' ? 'Claim approved — item marked as claimed' : 'Claim rejected');
      setReview(null);
      setNote('');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not save that decision'));
    } finally {
      setBusy(false);
    }
  }

  const cards = stats
    ? [
        ['Items on the desk', stats.totalItems, '📦'],
        ['Still open', stats.openItems, '🔎'],
        ['Waiting for review', stats.pendingClaims, '⏳'],
        ['Reunited', stats.returnedItems + stats.claimedItems, '🤝'],
      ]
    : [];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Staff console</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Claim desk</h1>
        <p className="mt-1 text-sm text-slate-500">
          Claims are ranked by confidence. Read the private detail, then approve the claimant who actually knows the item.
        </p>
      </header>

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, icon]) => (
            <div key={label} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
                <span className="text-lg">{icon}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1">
            {TABS.map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setTab(value);
                  setPage(0);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  tab === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              {stats ? `${stats.approvedClaims} approved · ${stats.rejectedClaims} rejected · ${stats.totalClaims} total` : ''}
            </span>
            <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={load}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card h-36 animate-pulse" />
          ))}
        </div>
      ) : claims.content.length === 0 ? (
        <Empty
          icon="✅"
          title={tab === 'PENDING' ? 'Queue is clear' : 'Nothing here yet'}
          hint={
            tab === 'PENDING'
              ? 'No claims are waiting for review. New claims show up here with their confidence score.'
              : 'Try another tab, or wait for new claims to arrive.'
          }
        />
      ) : (
        <div className="space-y-3">
          {claims.content.map((claim) => (
            <article key={claim.id} className="card overflow-hidden">
              <div className="flex flex-col gap-4 p-4 sm:flex-row">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                  {categoryEmoji(claim.itemTitle)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/items/${claim.itemId}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-700">
                      {claim.itemTitle}
                    </Link>
                    <StatusBadge status={claim.status} />
                    <span className="text-xs text-slate-400">{relativeTime(claim.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Claimed by <span className="font-medium text-slate-700">{claim.claimantName}</span>
                  </p>

                  <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    “{claim.message}”
                  </p>

                  <div className="mt-2 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">🔒 Private detail</p>
                    <p className="mt-0.5 text-xs text-amber-900">{claim.itemHiddenDetail || 'No private detail was provided.'}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="min-w-36 flex-1">
                      <ScoreBar score={claim.matchScore} />
                    </div>
                    <ScoreBadge score={claim.matchScore} label={claim.matchLabel} />
                    {claim.reviewedBy ? (
                      <span className="text-xs text-slate-500">
                        {claim.status.toLowerCase()} by {claim.reviewedBy} · {fmtDateTime(claim.reviewedAt)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {claim.status === 'PENDING' ? (
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        setReview({ claim, mode: 'approve' });
                        setNote('');
                      }}
                      className="btn-primary flex-1 px-3 py-2 text-xs"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReview({ claim, mode: 'reject' });
                        setNote('');
                      }}
                      className="btn-ghost flex-1 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
          <Pagination page={page} totalPages={claims.totalPages} onChange={setPage} />
        </div>
      )}

      <Modal
        open={Boolean(review)}
        title={review?.mode === 'approve' ? 'Approve this claim?' : 'Reject this claim?'}
        subtitle={
          review
            ? `${review.claim.claimantName} · ${review.claim.matchScore}% match on “${review.claim.itemTitle}”`
            : ''
        }
        onClose={() => setReview(null)}
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setReview(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={review?.mode === 'approve' ? 'btn-primary' : 'btn-accent !bg-rose-600 hover:!bg-rose-500'}
              onClick={decide}
              disabled={busy}
            >
              {busy ? 'Saving…' : review?.mode === 'approve' ? 'Approve & mark claimed' : 'Reject claim'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          {review?.mode === 'approve'
            ? 'Approving closes the item for other claimants and notifies both the claimant and the reporter.'
            : 'The claimant is notified with your note. The item stays open for other claims.'}
        </p>
        <label className="label mt-4" htmlFor="note">
          Desk note (optional)
        </label>
        <textarea
          id="note"
          className="input min-h-20 resize-y"
          placeholder={
            review?.mode === 'approve'
              ? 'Matched the private detail exactly.'
              : 'The description did not match the private detail.'
          }
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
        />
      </Modal>
    </div>
  );
}

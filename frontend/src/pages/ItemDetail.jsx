import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ScoreBadge, StatusBadge, TypeBadge } from '../components/Badges';
import { categoryEmoji, fmtDate, fmtDateTime } from '../lib/format';

export default function ItemDetail() {
  const { id } = useParams();
  const { user, isStaff } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function load() {
    try {
      const { data } = await api.get(`/items/${id}`);
      setItem(data);
      setError('');
    } catch (err) {
      setError(apiError(err, 'Could not load this item'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, [id]);

  async function submitClaim(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/items/${id}/claims`, { message, evidenceUrl: evidenceUrl || null });
      setResult({ score: data.matchScore, label: data.matchLabel });
      setMessage('');
      setEvidenceUrl('');
      toast.success('Claim submitted for verification');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not submit your claim'));
    } finally {
      setBusy(false);
    }
  }

  async function markReturned() {
    setBusy(true);
    try {
      await api.post(`/items/${id}/return`);
      toast.success('Marked as returned');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not update this item'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card h-80 animate-pulse lg:col-span-2" />
        <div className="card h-80 animate-pulse" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="card px-6 py-16 text-center">
        <p className="text-lg font-semibold text-slate-800">{error || 'Item not found'}</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          ← Back to browse
        </Link>
      </div>
    );
  }

  const ownReport = user && item.reporterId === user.id;
  const canClaim = user && !ownReport && item.status === 'OPEN';

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
        ← Back to browse
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        <article className="card overflow-hidden lg:col-span-2">
          <div className="relative flex h-56 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-7xl">{categoryEmoji(item.category)}</span>
            )}
            <div className="absolute left-4 top-4 flex gap-1.5">
              <TypeBadge type={item.type} />
              <StatusBadge status={item.status} />
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{item.title}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {item.category} · reported by {item.reporterName}
                </p>
              </div>
              <span className="chip bg-slate-100 text-slate-600 ring-slate-200">
                {item.claimCount} claim{item.claimCount === 1 ? '' : 's'}
              </span>
            </div>

            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{item.description}</p>

            <dl className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Location</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{item.locationName || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Item date</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{fmtDate(item.eventDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Listed</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{fmtDateTime(item.createdAt)}</dd>
              </div>
            </dl>

            {item.hiddenDetailRevealed ? (
              <div className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  🔒 Private detail
                </p>
                <p className="mt-1 text-sm leading-relaxed text-amber-900">{item.hiddenDetail || '—'}</p>
                <p className="mt-2 text-[11px] text-amber-700/80">
                  Visible to the reporter and desk staff only. The claim matcher compares claimant messages against this.
                </p>
              </div>
            ) : null}

            {isStaff && item.status === 'CLAIMED' ? (
              <button type="button" onClick={markReturned} className="btn-primary mt-5" disabled={busy}>
                Mark as returned to owner
              </button>
            ) : null}
          </div>
        </article>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-base font-semibold text-slate-900">Claim this item</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Describe something only the real owner would know. The desk compares it against the private detail — no
              guessing games, no first-come-first-served.
            </p>

            {!user ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
                  Sign in
                </Link>{' '}
                to open a claim.
              </div>
            ) : ownReport ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                This is your report. You can see the private detail, but you cannot claim it.
              </div>
            ) : !canClaim ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                This item is {item.status.toLowerCase()} and is not accepting new claims.
              </div>
            ) : (
              <form onSubmit={submitClaim} className="mt-4 space-y-3">
                <div>
                  <label className="label" htmlFor="message">
                    Your proof
                  </label>
                  <textarea
                    id="message"
                    className="input min-h-28 resize-y"
                    placeholder="e.g. There's a crack on the hinge and a red dot sticker on the left earbud."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={1000}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="evidence">
                    Evidence link (optional)
                  </label>
                  <input
                    id="evidence"
                    className="input"
                    placeholder="Photo, receipt or chat screenshot URL"
                    value={evidenceUrl}
                    onChange={(event) => setEvidenceUrl(event.target.value)}
                  />
                </div>
                <button type="submit" className="btn-accent w-full" disabled={busy}>
                  {busy ? 'Submitting…' : 'Submit claim'}
                </button>
              </form>
            )}

            {result ? (
              <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
                <p className="text-xs uppercase tracking-wide text-slate-400">Auto-verification</p>
                <p className="mt-1 flex items-center gap-2">
                  <ScoreBadge score={result.score} label={result.label} />
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  Submitted to the desk queue. A staff member confirms before the item is released.
                </p>
              </div>
            ) : null}
          </div>

          <div className="card p-5 text-sm text-slate-600">
            <h3 className="text-sm font-semibold text-slate-900">How claims are decided</h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-500">
              <li>You describe the item in your own words.</li>
              <li>The matcher scores your words against the private detail.</li>
              <li>Staff review the highest-confidence claims first.</li>
              <li>One approved claim closes the item for everyone else.</li>
            </ol>
          </div>

          {isStaff ? (
            <Link to="/desk" className="btn-ghost w-full">
              Open the claim desk →
            </Link>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

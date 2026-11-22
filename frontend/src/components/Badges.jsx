const STATUS_STYLES = {
  OPEN: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CLAIMED: 'bg-amber-50 text-amber-700 ring-amber-200',
  RETURNED: 'bg-slate-100 text-slate-600 ring-slate-200',
  CLOSED: 'bg-slate-100 text-slate-500 ring-slate-200',
  PENDING: 'bg-sky-50 text-sky-700 ring-sky-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  WITHDRAWN: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export function StatusBadge({ status }) {
  return <span className={`chip ${STATUS_STYLES[status] || STATUS_STYLES.CLOSED}`}>{status}</span>;
}

export function TypeBadge({ type }) {
  const lost = type === 'LOST';
  return (
    <span
      className={`chip ${
        lost ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-indigo-50 text-indigo-700 ring-indigo-200'
      }`}
    >
      {lost ? 'Lost' : 'Found'}
    </span>
  );
}

export function ScoreBadge({ score = 0, label }) {
  const tone =
    score >= 60
      ? 'bg-emerald-600 text-white ring-emerald-600'
      : score >= 30
        ? 'bg-amber-500 text-white ring-amber-500'
        : 'bg-slate-200 text-slate-700 ring-slate-300';
  return (
    <span className={`chip ${tone}`}>
      {score}% match{label ? ` · ${label}` : ''}
    </span>
  );
}

export function ScoreBar({ score = 0 }) {
  const color = score >= 60 ? 'bg-emerald-500' : score >= 30 ? 'bg-amber-500' : 'bg-slate-300';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(score, 3)}%` }} />
    </div>
  );
}

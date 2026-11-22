import { Link } from 'react-router-dom';
import { StatusBadge, TypeBadge } from './Badges';
import { categoryEmoji, fmtDate } from '../lib/format';

export default function ItemCard({ item }) {
  return (
    <Link
      to={`/items/${item.id}`}
      className="card group rise flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
          {categoryEmoji(item.category)}
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <TypeBadge type={item.type} />
          <StatusBadge status={item.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4">
        <h3 className="line-clamp-1 text-[15px] font-semibold text-slate-900 group-hover:text-indigo-700">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">{item.description}</p>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="inline-flex min-w-0 items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span className="truncate">{item.locationName || 'Campus'}</span>
          </span>
          <span>{fmtDate(item.eventDate)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">
            {item.claimCount > 0 ? `${item.claimCount} claim${item.claimCount > 1 ? 's' : ''}` : 'No claims yet'}
          </span>
          <span className="font-semibold text-indigo-600 group-hover:underline">View →</span>
        </div>
      </div>
    </Link>
  );
}

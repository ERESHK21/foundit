export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <span className="text-slate-500">
        Page {page + 1} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button type="button" className="btn-ghost px-3 py-2" disabled={page === 0} onClick={() => onChange(page - 1)}>
          ← Prev
        </button>
        <button
          type="button"
          className="btn-ghost px-3 py-2"
          disabled={page + 1 >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

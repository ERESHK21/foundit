export default function Empty({ icon = '🗂️', title, hint, action }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {hint ? <p className="max-w-sm text-sm text-slate-500">{hint}</p> : null}
      {action}
    </div>
  );
}

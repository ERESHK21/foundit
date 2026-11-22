import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiError } from '../lib/api';

const today = new Date().toISOString().slice(0, 10);

export default function ReportItem() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    type: 'FOUND',
    title: '',
    category: 'Electronics',
    locationName: '',
    eventDate: today,
    description: '',
    hiddenDetail: '',
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/categories')
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]));
  }, []);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/items', {
        type: form.type,
        title: form.title,
        description: form.description,
        category: form.category,
        locationName: form.locationName,
        eventDate: form.eventDate || null,
        hiddenDetail: form.hiddenDetail || null,
        imageUrl: null,
      });
      if (file) {
        const body = new FormData();
        body.append('file', file);
        await api.post(`/items/${data.id}/image`, body);
      }
      toast.success('Report published');
      navigate(`/items/${data.id}`);
    } catch (err) {
      setError(apiError(err, 'Could not publish this report'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">New report</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Add something to the desk</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reports go live immediately. The private detail is what makes claim verification work — keep it specific.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: 'FOUND', title: 'I found something', hint: 'Hand it in / list it for the owner', icon: '🙌' },
            { value: 'LOST', title: 'I lost something', hint: 'Let finders know what to look for', icon: '🕵️' },
          ].map((option) => {
            const active = form.type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => set('type', option.value)}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  active
                    ? 'border-indigo-400 bg-indigo-50/70 ring-4 ring-indigo-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-xl">{option.icon}</span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{option.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{option.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              className="input"
              placeholder="e.g. Blue AirPods Pro case"
              value={form.title}
              onChange={(event) => set('title', event.target.value)}
              maxLength={120}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <select id="category" className="input" value={form.category} onChange={(event) => set('category', event.target.value)}>
              {(categories.length ? categories : ['Other']).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="eventDate">
              Date {form.type === 'FOUND' ? 'found' : 'lost'}
            </label>
            <input
              id="eventDate"
              type="date"
              className="input"
              value={form.eventDate}
              max={today}
              onChange={(event) => set('eventDate', event.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              className="input"
              placeholder="e.g. Central Library, 2nd floor"
              value={form.locationName}
              onChange={(event) => set('locationName', event.target.value)}
              maxLength={120}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">
              Public description
            </label>
            <textarea
              id="description"
              className="input min-h-28 resize-y"
              placeholder="What does it look like? Where exactly? Anything a finder should know."
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
              maxLength={2000}
              required
            />
            <p className="mt-1 text-xs text-slate-400">Visible to everyone browsing the desk.</p>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <label className="label !mb-0" htmlFor="hiddenDetail">
                Private detail
              </label>
              <span className="chip bg-amber-50 text-amber-700 ring-amber-200">🔒 staff only</span>
            </div>
            <textarea
              id="hiddenDetail"
              className="input mt-1.5 min-h-24 resize-y border-amber-200 bg-amber-50/40"
              placeholder="e.g. crack on the hinge, red dot sticker on the left earbud, library card and a photo of a dog inside."
              value={form.hiddenDetail}
              onChange={(event) => set('hiddenDetail', event.target.value)}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-slate-500">
              Only you and the claim desk see this. Claimants who describe it accurately score higher. Never shown in the
              public listing.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="photo">
              Photo (optional)
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="block w-full max-w-sm cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:border-slate-400"
              />
              {preview ? <img src={preview} alt="preview" className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200" /> : null}
            </div>
            <p className="mt-1 text-xs text-slate-400">Max 5 MB. PNG, JPG, WEBP or GIF.</p>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">{error}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            By publishing you confirm the item is at the desk or available to hand in.
          </p>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Publishing…' : 'Publish report'}
          </button>
        </div>
      </form>
    </div>
  );
}

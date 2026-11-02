import { useState } from 'react';
import SEO from '../components/SEO';
import Turnstile from '../components/Turnstile';
import SubmitSuccess from '../components/SubmitSuccess';
import { useFetch } from '../hooks/useFetch';
import { LoadingState, ErrorState } from '../components/States';

const CATS = ['Notes', 'Past questions', 'Slides', 'Textbook'];
const EXTS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png'];
const MAX = 6 * 1024 * 1024;

export default function Contribute() {
  const { data, loading, error: loadError } = useFetch('/api/public/browse');
  const [f, setF] = useState({ name: '', title: '', course: '', category: 'Notes', description: '' });
  const [file, setFile] = useState(null);
  const [tok, setTok] = useState('');
  const [wkey, setWkey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!file) return setErr('Please choose a file.');
    if (!EXTS.includes(file.name.split('.').pop().toLowerCase())) return setErr('This file type is not allowed.');
    if (file.size > MAX) return setErr('File is too large. The limit is 6 MB.');
    if (!tok) return setErr('Please complete the verification.');
    setBusy(true);
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    fd.append('turnstile', tok);
    try {
      const r = await fetch('/api/public/upload', { method: 'POST', body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Upload failed. Please try again.');
      setDone(d);
    } catch (x) {
      setErr(x.message);
      setTok('');
      setWkey(wkey + 1);
    }
    setBusy(false);
  };

  const courses = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (n.id && n.code && !courses.some((c) => c.id === n.id)) courses.push(n);
    Object.values(n).forEach(walk);
  };
  walk(data);
  courses.sort((a, b) => String(a.code).localeCompare(String(b.code)));

  if (done) return <SubmitSuccess done={done} />;
  if (loading) return <LoadingState />;
  if (loadError) return <div className="container"><ErrorState message="Could not load courses." /></div>;

  return (
    <div className="container form-page">
      <SEO title="Contribute" />
      <h1>Contribute a file</h1>
      <p>Your file stays private until an admin approves it.</p>
      <form onSubmit={submit}>
        <label>Your name
          <input value={f.name} onChange={set('name')} maxLength={80} required />
        </label>
        <label>Title
          <input value={f.title} onChange={set('title')} maxLength={150} required />
        </label>
        <label>Course
          <select value={f.course} onChange={set('course')} required>
            <option value="">Choose a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} {c.title}</option>
            ))}
          </select>
        </label>
        <label>Material type
          <select value={f.category} onChange={set('category')}>
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Description (optional)
          <textarea value={f.description} onChange={set('description')} rows={3} maxLength={500} />
        </label>
        <label>File (6 MB limit)
          <input type="file" accept={EXTS.map((x) => '.' + x).join(',')} onChange={(e) => setFile(e.target.files[0] || null)} />
        </label>
        <Turnstile key={wkey} onToken={setTok} />
        {err && <div className="notice">{err}</div>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Uploading...' : 'Submit for review'}
        </button>
      </form>
    </div>
  );
}

  const courses = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (n.id && n.code && !courses.some((c) => c.id === n.id)) courses.push(n);
    Object.values(n).forEach(walk);
  };
  walk(data);
  courses.sort((a, b) => String(a.code).localeCompare(String(b.code)));

  if (done) return <SubmitSuccess done={done} />;
  if (loading) return <LoadingState />;
  if (loadError) return <div className="container"><ErrorState message="Could not load courses." /></div>;

  return (
    <div className="container form-page">
      <SEO title="Contribute" />
      <h1>Contribute a file</h1>
      <p>Your file stays private until an admin approves it.</p>
      <form onSubmit={submit}>
        <label>Your name
          <input value={f.name} onChange={set('name')} maxLength={80} required />
        </label>
        <label>Title
          <input value={f.title} onChange={set('title')} maxLength={150} required />
        </label>
        <label>Course
          <select value={f.course} onChange={set('course')} required>
            <option value="">Choose a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} {c.title}</option>
            ))}
          </select>
        </label>
        <label>Material type
          <select value={f.category} onChange={set('category')}>
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Description (optional)
          <textarea value={f.description} onChange={set('description')} rows={3} maxLength={500} />
        </label>
        <label>File (6 MB limit)
          <input type="file" accept={EXTS.map((x) => '.' + x).join(',')} onChange={(e) => setFile(e.target.files[0] || null)} />
        </label>
        <Turnstile key={wkey} onToken={setTok} />
        {err && <div className="notice">{err}</div>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Uploading...' : 'Submit for review'}
        </button>
      </form>
    </div>
  );
}

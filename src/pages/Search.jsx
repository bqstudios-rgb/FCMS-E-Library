import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import MaterialCard from '../components/MaterialCard';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

export default function Search() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState({ results: [], courses: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ready = q.trim().length >= 2;

  useEffect(() => {
    if (!ready) { setRes({ results: [], courses: [] }); setError(null); setLoading(false); return; }
    let live = true;
    const t = setTimeout(() => {
      setLoading(true);
      fetch('/api/public/search?q=' + encodeURIComponent(q.trim()))
        .then((r) => { if (r.status === 429) throw new Error('Too many searches. Please wait a minute.'); if (!r.ok) throw new Error('Search failed. Please try again.'); return r.json(); })
        .then((d) => { if (live) { setRes({ results: d.results || [], courses: d.courses || [] }); setError(null); } })
        .catch((e) => live && setError(e.message))
        .finally(() => live && setLoading(false));
    }, 500);
    return () => { live = false; clearTimeout(t); };
  }, [q, ready]);

  const none = ready && !loading && !error && !res.results.length && !res.courses.length;
  return (
    <div className="container" style={{ padding: '24px 16px' }}>
      <SEO title="Search" description="Search FCMS Library by course code, title or contributor." />
      <h3 className="section-title">Search</h3>
      <input type="text" placeholder="Course code, title or contributor" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {!ready && <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: 14 }}>Type at least 2 characters to search.</p>}
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {none && <EmptyState message="No match yet. Try a course code like MCM 201." />}
      {!loading && !error && res.courses.map((c) => (
        <Link key={c.id} to={'/course/' + c.id} className="row-link"><div><h4>{c.code}: {c.title}</h4></div></Link>
      ))}
      {!loading && !error && res.results.map((m) => <MaterialCard key={m.id} material={m} />)}
    </div>
  );
}

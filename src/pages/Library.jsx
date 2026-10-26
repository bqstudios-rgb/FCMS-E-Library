import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import SEO from '../components/SEO';
import { useFetch } from '../hooks/useFetch';
import MaterialCard from '../components/MaterialCard';
import ViewToggle from '../components/ViewToggle';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

const hide = (e) => { e.currentTarget.style.display = 'none'; };
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

export default function Library() {
  const [mode, setMode] = useState('list');
  const home = useFetch('/api/public/home');
  const browse = useFetch('/api/public/browse');

  const totals = {};
  ((browse.data && browse.data.courses) || []).forEach((c) => {
    const t = totals[c.level_id] || (totals[c.level_id] = { m: 0, t: 0 });
    t.m += c.material_count;
    t.t += c.textbook_count;
  });

  const list = (items) => (
    <div className={mode === 'grid' ? 'files-grid' : ''}>
      {items.map((m) => <MaterialCard key={m.id} material={m} />)}
    </div>
  );
  const d = home.data;

  return (
    <>
      <SEO title="Library" description="Browse FCMS Library materials by level, or see what was uploaded recently." />
      <div className="banner">
        <img className="banner-img" src="/image/library-banner.jpg" alt="" onError={hide} />
        <h2>Library Collection</h2>
        <p>Find notes, slides and past questions.</p>
        <Link to="/search" className="hero-search"><SearchIcon size={20} />Course code, title or contributor</Link>
      </div>
      <div className="container" style={{ paddingBottom: 32 }}>
        <h3 className="section-title">Browse by level</h3>
        {browse.loading ? <LoadingState /> : browse.error ? <ErrorState message={browse.error} /> : (
          <div className="grid-2">
            {browse.data.levels.map((l) => {
              const t = totals[l.id] || { m: 0, t: 0 };
              return (
                <Link key={l.id} to={'/browse?level=' + l.id} className="card level-card">
                  <h3>{l.name}L</h3>
                  <p>{plural(t.m, 'material')} {'\u2022'} {plural(t.t, 'textbook')}</p>
                </Link>
              );
            })}
          </div>
        )}
        <div className="section-head">
          <h3 className="section-title">Recently uploaded</h3>
          <ViewToggle mode={mode} onChange={setMode} />
        </div>
        {home.loading ? <LoadingState /> : home.error ? <ErrorState message={home.error} /> : d.recent.length ? list(d.recent) : <EmptyState message="Nothing has been uploaded yet." />}
        {d && d.topPicks.length > 0 && (<><h3 className="section-title" style={{ marginTop: 32 }}>Top picks</h3>{list(d.topPicks)}</>)}
        {d && d.topRead.length > 0 && (<><h3 className="section-title" style={{ marginTop: 32 }}>Top read</h3>{list(d.topRead)}</>)}
      </div>
    </>
  );
}

import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import { useFetch } from '../hooks/useFetch';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

export default function Browse() {
  const { data, loading, error } = useFetch('/api/public/browse');
  const [params, setParams] = useSearchParams();
  const level = params.get('level') || 'lvl_100';
  const sem = params.get('sem') || 'sem_1';
  const set = (k, v) => { const p = new URLSearchParams(params); p.set(k, v); setParams(p); };
  const courses = data ? data.courses.filter((c) => c.level_id === level && c.semester_id === sem) : [];
  return (
    <div className="container" style={{ padding: '24px 16px' }}>
      <SEO title="Browse courses" description="Browse FCMS Library courses by level and semester." />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <>
          <div className="tabs">
            {data.levels.map((l) => <button key={l.id} className={'tab' + (level === l.id ? ' active' : '')} onClick={() => set('level', l.id)}>{l.name}L</button>)}
          </div>
          <div className="tabs" style={{ marginBottom: 24 }}>
            {data.semesters.map((s) => <button key={s.id} className={'tab' + (sem === s.id ? ' active' : '')} onClick={() => set('sem', s.id)}>{s.name} Semester</button>)}
          </div>
          {courses.length ? courses.map((c) => (
            <Link key={c.id} to={'/course/' + c.id} className="row-link">
              <div style={{ flex: 1 }}>
                <h4>{c.code}: {c.title}</h4>
                <p>{c.material_count} {c.material_count === 1 ? 'material' : 'materials'}</p>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </Link>
          )) : <EmptyState message="No courses for this level and semester yet." />}
        </>
      )}
    </div>
  );
}

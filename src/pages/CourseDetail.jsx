import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { useFetch } from '../hooks/useFetch';
import MaterialCard from '../components/MaterialCard';
import ViewToggle from '../components/ViewToggle';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

const CATS = ['All', 'Notes', 'Slides', 'Past questions', 'Textbook'];

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch('/api/public/courses/' + encodeURIComponent(id));
  const [cat, setCat] = useState('All');
  const [mode, setMode] = useState('list');
  if (loading) return <LoadingState />;
  if (error || !data) return <div className="container"><ErrorState message="Course not found." /></div>;
  const items = cat === 'All' ? data.materials : data.materials.filter((m) => m.category === cat);
  return (
    <div className="container" style={{ padding: '24px 16px' }}>
      <SEO title={data.course.code} description={'Study materials for ' + data.course.code + ': ' + data.course.title} />
      <button className="btn-secondary" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}><ArrowLeft size={16} />Back</button>
      <h2 style={{ color: 'var(--primary)', marginBottom: 4 }}>{data.course.code}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>{data.course.title}</p>
      <div className="tabs">
        {CATS.map((c) => <button key={c} className={'tab' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      <div className="section-head">
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Files</span>
        <ViewToggle mode={mode} onChange={setMode} />
      </div>
      {items.length ? (
        <div className={mode === 'grid' ? 'files-grid' : ''}>
          {items.map((m) => <MaterialCard key={m.id} material={m} hideCourse />)}
        </div>
      ) : <EmptyState message={cat === 'All' ? 'No materials for this course yet.' : 'No ' + cat.toLowerCase() + ' for this course yet.'} />}
    </div>
  );
}

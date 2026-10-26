import { List, LayoutGrid } from 'lucide-react';

export default function ViewToggle({ mode, onChange }) {
  return (
    <div className="view-toggle" role="group" aria-label="View mode">
      <button type="button" className={mode === 'list' ? 'active' : ''} onClick={() => onChange('list')}><List size={16} />List</button>
      <button type="button" className={mode === 'grid' ? 'active' : ''} onClick={() => onChange('grid')}><LayoutGrid size={16} />Grid</button>
    </div>
  );
}

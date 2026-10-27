import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Layout() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const link = { padding: '8px 0', borderBottom: '1px solid var(--border)', fontWeight: 500 };
  return (
    <div style={{ paddingTop: 60, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 60, background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Link to="/" onClick={close} style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 18, color: 'var(--primary)', fontWeight: 700 }}>FCMS Library</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Communication and Media Studies</span>
          </Link>
          <button aria-label="Menu" onClick={() => setOpen(!open)} style={{ background: 'none', color: 'var(--primary)', padding: 4 }}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      {open && (
        <nav style={{ position: 'fixed', top: 60, left: 0, right: 0, background: '#fff', borderBottom: '1px solid var(--border)', padding: 16, zIndex: 99, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Link to="/library" onClick={close} style={link}>Library</Link>
          <Link to="/search" onClick={close} style={link}>Search</Link>
          <Link to="/contribute" onClick={close} style={link}>Contribute</Link>
        </nav>
      )}
      <main style={{ flex: 1 }}><Outlet /></main>
      <footer style={{ padding: '24px 0', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{'\u00A9'} {new Date().getFullYear()} FCMS Library</p>
      </footer>
    </div>
  );
}

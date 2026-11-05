import { useState } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const INFO = {
  pending: { Icon: Clock, color: '#002F68', bg: '#EEF4FC', label: 'Pending review', text: 'An admin has not reviewed this file yet. Check back later.' },
  approved: { Icon: CheckCircle, color: '#3F8A2A', bg: '#E5F2E0', label: 'Approved', text: 'Your file passed review and is now in the library.' },
  rejected: { Icon: XCircle, color: '#D61F1F', bg: '#FDE8E8', label: 'Not approved', text: 'Your file was not approved.' },
};
const input = { width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: 999, fontSize: 16, marginBottom: 12, boxSizing: 'border-box' };

export default function Track() {
  const [ticket, setTicket] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState(null);

  async function go(e) {
    e.preventDefault();
    setBusy(true); setErr(''); setRes(null);
    try {
      const r = await fetch('/api/public/track', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket }),
      });
      const d = await r.json();
      if (!r.ok) setErr(d.error || 'Something went wrong.'); else setRes(d);
    } catch { setErr('Network error. Please try again.'); }
    setBusy(false);
  }

  const i = res && INFO[res.status];
  return (
    <div className="container" style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ color: '#002F68', fontSize: 26, marginBottom: 8 }}>Track your upload</h1>
      <p style={{ color: '#6B7280', marginBottom: 20 }}>Enter the ticket number you received after uploading.</p>
      <form onSubmit={go}>
        <input style={input} placeholder="Ticket (DUK-482916)" value={ticket} onChange={(e) => setTicket(e.target.value)} autoCapitalize="characters" required />
        <button type="submit" disabled={busy} style={{ width: '100%', padding: '12px 16px', border: 0, borderRadius: 999, background: '#002F68', color: '#fff', fontSize: 16, cursor: 'pointer' }}>
          {busy ? 'Checking...' : 'Check status'}
        </button>
      </form>
      {err && <p role="alert" style={{ color: '#D61F1F', marginTop: 16 }}>{err}</p>}
      {i && (
        <div style={{ background: i.bg, borderRadius: 16, padding: 20, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: i.color, fontWeight: 600 }}>
            <i.Icon size={22} /> {i.label}
          </div>
          <p style={{ color: '#1F2937', margin: '12px 0 4px', fontWeight: 600 }}>{res.title}</p>
          <p style={{ color: '#6B7280', margin: 0, fontSize: 14 }}>{res.ticket} · {res.category}</p>
          <p style={{ color: '#1F2937', marginTop: 12 }}>{i.text}</p>
          {res.reason && <p style={{ color: '#1F2937' }}>Reason: {res.reason}</p>}
        </div>
      )}
    </div>
  );
}

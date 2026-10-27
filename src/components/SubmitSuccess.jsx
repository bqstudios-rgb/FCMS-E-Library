import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';

export default function SubmitSuccess({ done }) {
  const [copied, setCopied] = useState('');
  const copy = (label, text) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };
  const save = () => {
    const body = 'FCMS Library submission\nTicket number: ' + done.ticket + '\nSecret code: ' + done.secret + '\n';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
    a.download = 'fcms-ticket-' + done.ticket + '.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const row = (label, value) => (
    <div className="secret-row">
      <div><p className="secret-label">{label}</p><h3 className="secret-value">{value}</h3></div>
      <button type="button" className="btn-secondary" onClick={() => copy(label, value)}>
        {copied === label ? <Check size={16} /> : <Copy size={16} />}{copied === label ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
  return (
    <div className="container form-page">
      <div className="notice ok"><strong>Submitted for review.</strong> Save these now. You need both to check your status, and we cannot recover them.</div>
      {row('Ticket number', done.ticket)}
      {row('Secret code', done.secret)}
      {done.needsCompression && <div className="notice">Your file is over 3 MB, so an admin will compress it before it can be published. This may take a little longer.</div>}
      <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={save}><Download size={16} />Download as text file</button>
    </div>
  );
}

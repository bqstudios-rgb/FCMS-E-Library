import { useEffect, useRef, useState } from 'react';

const SITE_KEY = '0x4AAAAAAFmTpXkVyoEUblnG';

export default function Feedback() {
  const box = useRef(null);
  const wid = useRef(null);
  const tok = useRef('');
  const [name, setName] = useState('');
  const [anon, setAnon] = useState(false);
  const [text, setText] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    let t;
    const mount = () => {
      if (window.turnstile && box.current && wid.current === null) {
        wid.current = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          callback: (v) => { tok.current = v; },
          'expired-callback': () => { tok.current = ''; },
        });
      } else if (wid.current === null) {
        t = setTimeout(mount, 300);
      }
    };
    mount();
    return () => {
      clearTimeout(t);
      if (window.turnstile && wid.current !== null) { window.turnstile.remove(wid.current); wid.current = null; }
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setState('sending');
    try {
      const r = await fetch('/api/public/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, anonymous: anon, text, turnstile: tok.current }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Could not send. Please try again.');
      setState('done');
    } catch (err) {
      setError(err.message);
      setState('idle');
      if (window.turnstile && wid.current !== null) { window.turnstile.reset(wid.current); tok.current = ''; }
    }
  };

  return (
    <section className="feedback" id="feedback">
      <h3>Feedback</h3>
      <p className="fb-sub">Got a suggestion? Tell us.</p>
      {state === 'done' ? (
        <div className="fb-ok">Thank you! Your feedback has been sent.</div>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="fbName">Name</label>
          <input id="fbName" type="text" maxLength={60} placeholder="Your name (optional)" value={anon ? '' : name} disabled={anon} onChange={(e) => setName(e.target.value)} />
          <label className="anon"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> Send anonymously</label>
          <label htmlFor="fbText">Feedback</label>
          <textarea id="fbText" rows={4} maxLength={1000} placeholder="Type your feedback here..." value={text} onChange={(e) => setText(e.target.value)} required />
          <div ref={box} style={{ marginBottom: 12 }} />
          {error && <p className="fb-err">{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 12, fontSize: 16 }} disabled={state === 'sending'}>{state === 'sending' ? 'Sending...' : 'Submit'}</button>
        </form>
      )}
    </section>
  );
}

import { useEffect, useRef } from 'react';

const SITE_KEY = '0x4AAAAAAFmTpXkVyoEUblnG';

export default function Turnstile({ onToken, action }) {
  const box = useRef(null);
  useEffect(() => {
    let t;
    let id = null;
    const mount = () => {
      if (window.turnstile && box.current) {
        const opts = { sitekey: SITE_KEY, callback: onToken, 'expired-callback': () => onToken('') };
        if (action) opts.action = action;
        id = window.turnstile.render(box.current, opts);
      } else t = setTimeout(mount, 300);
    };
    mount();
    return () => { clearTimeout(t); if (window.turnstile && id !== null) window.turnstile.remove(id); };
  }, []);
  return <div ref={box} style={{ marginBottom: 16 }} />;
}

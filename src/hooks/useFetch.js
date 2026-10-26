import { useState, useEffect } from 'react';

export function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let live = true;
    setState({ data: null, loading: true, error: null });
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(r.status === 404 ? 'Not found' : 'Could not load data. Please try again.'); return r.json(); })
      .then((data) => live && setState({ data, loading: false, error: null }))
      .catch((e) => live && setState({ data: null, loading: false, error: e.message }));
    return () => { live = false; };
  }, [url]);
  return state;
}

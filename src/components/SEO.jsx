import { useEffect } from 'react';

export default function SEO({ title, description }) {
  useEffect(() => {
    document.title = title ? title + ' | FCMS Library' : 'FCMS Library';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description || 'Digital library for Communication and Media Studies students.');
  }, [title, description]);
  return null;
}

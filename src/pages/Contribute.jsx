import { useState } from 'react';
import SEO from '../components/SEO';
import Turnstile from '../components/Turnstile';
import SubmitSuccess from '../components/SubmitSuccess';
import { useFetch } from '../hooks/useFetch';
import { LoadingState, ErrorState } from '../components/States';

const CATS = ['Notes', 'Past questions', 'Slides', 'Textbook'];
const EXTS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png'];
const MAX = 6 * 1024 * 1024;

export default function Contribute() {
  const { data, loading, error: loadError } = useFetch('/api/public/browse');
  const [f, setF] = useState({ name: '', title: '', course: '', category: 'Notes', description: '' });
  const [file, setFile] = useState(null);
  const [tok, setTok] = useState('');
  const [wkey, setWkey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!file) return setErr('Please choose a file.');
    if (!EXTS.includes(file.name.split('.').pop().toLowerCase())) return setErr('This file type is not allowed.');
    if (file.size > MAX) return setErr('File is too large. The limit is 6 MB.');
    if (!tok) return setErr('Please complete the verification.');
    setBusy(true);
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    fd.append('turnstile', tok);
    try {
      const r = await fetch('/api/public/upload', { method: 'POST', body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Upload failed. Please try again.');
      setDone(d);
    } catch (x) {
      setErr(x.message);
      setTok('');
      setWkey(wkey + 1);
    }
    setBusy(false);
  };

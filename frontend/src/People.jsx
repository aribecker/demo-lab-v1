import React, { useEffect, useRef, useState } from 'react';
import { listPeople, addPerson } from './peopleClient.js';
import './people.css';

export default function People() {
  const [name, setName] = useState(''), [people, setPeople] = useState([]), [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const active = useRef(null), pending = useRef(false), retry = useRef(null), mounted = useRef(false);
  async function load(before = null) {
    active.current?.abort(); const controller = new AbortController(); active.current = controller;
    const timeout = setTimeout(() => controller.abort(), 90000);
    setLoading(true); setError('');
    try {
      const result = await listPeople(before, controller.signal);
      if (controller.signal.aborted || !mounted.current) return;
      setPeople(current => before ? [...current, ...result.people.filter(p => !current.some(old => old.id === p.id))] : result.people);
      setCursor(result.nextCursor);
    } catch (e) { if (mounted.current && active.current === controller) setError(e.name === 'AbortError' ? 'The service is taking too long to respond. Please refresh the list.' : e.message); }
    finally { clearTimeout(timeout); if (mounted.current && active.current === controller) setLoading(false); }
  }
  useEffect(() => { mounted.current = true; load(); return () => { mounted.current = false; active.current?.abort(); }; }, []);
  async function submit(event) {
    event.preventDefault(); const trimmed = name.trim();
    if (pending.current || !trimmed || trimmed.length > 100 || loading) return;
    pending.current = true; setSaving(true); setError(''); setNotice('');
    // Preserve this UUID after an uncertain network failure, including a retry.
    if (!retry.current || retry.current.name !== trimmed) retry.current = { name: trimmed, id: crypto.randomUUID() };
    const controller = new AbortController(); active.current = controller;
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const person = await addPerson(trimmed, retry.current.id, controller.signal);
      if (controller.signal.aborted || !mounted.current) return;
      setPeople(current => [person, ...current.filter(p => p.id !== person.id)]); setName(''); retry.current = null;
      setNotice(`${person.name} was added to PostgreSQL.`);
    } catch (e) { if (mounted.current) setError(e.name === 'AbortError' ? 'The result is uncertain. Retry the same name safely; it will not be added twice.' : e.message); }
    finally { clearTimeout(timeout); pending.current = false; if (mounted.current) setSaving(false); }
  }
  return <>
    <section className="intro"><p className="eyebrow">HELLO WORLD · POSTGRESQL</p><h1 tabIndex={-1}>Hello, database!</h1>
      <p className="subtitle">Add a person and see the names stored by an independent Java microservice.</p></section>
    <section className="people-panel" aria-label="People database demo">
      <p className="people-note">Public demo: use sample names. Everyone can see this shared list.</p>
      <form onSubmit={submit}><label htmlFor="person-name">Name</label><div className="people-form">
        <input id="person-name" value={name} maxLength={100} required autoComplete="off" disabled={saving} onChange={e => setName(e.target.value)} placeholder="e.g. Ada Lovelace" />
        <button type="submit" disabled={loading || saving || !name.trim()}>{saving ? 'Adding…' : 'Add person'}</button></div></form>
      {error && <p role="alert" className="auth-message">{error}</p>}
      <p role="status" className="people-notice">{saving ? 'Saving person…' : notice || (loading ? 'Loading people…' : '')}</p>
      <div className="people-heading"><h2>People</h2><button type="button" disabled={loading || saving} onClick={() => { setNotice(''); load(); }}>Refresh list</button></div>
      {!loading && !people.length && !error && <p className="people-note">No people yet. Add the first person.</p>}
      <ul className="people-list" aria-label="Saved people" aria-busy={loading}>
        {people.map(person => <li key={person.id}><span><strong>{person.name}</strong><small>#{person.id}</small></span><time dateTime={person.createdAt}>{new Date(person.createdAt).toLocaleString('en-GB')}</time></li>)}
      </ul>
      {cursor && <button type="button" disabled={loading || saving} onClick={() => load(cursor)}>{loading ? 'Loading…' : 'Load more'}</button>}
      <p className="people-note">Records survive page refreshes and service restarts. The free demo database expires after 30 days.</p>
    </section>
  </>;
}

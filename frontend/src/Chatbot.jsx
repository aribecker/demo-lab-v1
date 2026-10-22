import React, { useEffect, useRef, useState } from 'react';
import { loadModels, sendChat } from './chatClient.js';
import './chatbot.css';

export default function Chatbot() {
  const [catalog, setCatalog] = useState(null), [model, setModel] = useState('openrouter/free');
  const [messages, setMessages] = useState([]), [text, setText] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [listening, setListening] = useState(false), [readAloud, setReadAloud] = useState(false);
  const active = useRef(null), recognition = useRef(null), pending = useRef(false), transcript = useRef(null);
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speech = window.speechSynthesis;
  useEffect(() => {
    const controller = new AbortController();
    loadModels(controller.signal).then(setCatalog).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => { controller.abort(); active.current?.abort(); recognition.current?.abort(); speech?.cancel(); };
  }, []);
  useEffect(() => { transcript.current?.scrollTo?.({ top: transcript.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);
  function stopVoice() { recognition.current?.abort(); setListening(false); speech?.cancel(); }
  function reset() { stopVoice(); setMessages([]); setText(''); setError(''); }
  function dictate() {
    if (listening) { recognition.current?.stop(); return; }
    speech?.cancel();
    const engine = new Recognition(); recognition.current = engine;
    engine.lang = 'es-AR'; engine.continuous = false; engine.interimResults = false;
    engine.onresult = event => setText(value => `${value} ${event.results[0][0].transcript}`.trim().slice(0, 4000));
    engine.onerror = () => { setListening(false); setError('No se pudo usar el micrófono. Revisá el permiso o escribí tu mensaje.'); };
    engine.onend = () => setListening(false);
    try { engine.start(); setListening(true); setError(''); }
    catch { setError('El dictado no está disponible. Podés escribir.'); }
  }
  async function submit(event) {
    event.preventDefault();
    if (pending.current || !text.trim() || !catalog?.configured || listening) return;
    stopVoice();
    const next = [...messages.map(({ role, content }) => ({ role, content })), { role: 'user', content: text.trim() }];
    if (next.length > 19 || next.reduce((n, m) => n + m.content.length, 0) > 24000) {
      setError('Se alcanzó el límite de contexto. Iniciá una conversación nueva.'); return;
    }
    pending.current = true; setBusy(true); setError('');
    const controller = new AbortController(); active.current = controller;
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const result = await sendChat({ model, messages: next }, controller.signal);
      if (controller.signal.aborted) return;
      setMessages([...next, { role: 'assistant', content: result.reply, model: result.model }]); setText('');
      if (readAloud && speech && window.SpeechSynthesisUtterance) {
        const utterance = new SpeechSynthesisUtterance(result.reply); utterance.lang = 'es-AR'; speech.speak(utterance);
      }
    } catch (e) { if (active.current === controller) setError(e.name === 'AbortError' ? 'Se agotó el tiempo de espera. Podés reintentar.' : e.message); }
    finally { clearTimeout(timeout); pending.current = false; setBusy(false); active.current = null; }
  }
  return <>
    <section className="intro"><p className="eyebrow">SPRING AI · RAMA EXPERIMENTAL</p>
      <h1 tabIndex={-1}>Chatbot.</h1><p className="subtitle">Elegí un modelo gratuito y conversá por texto o voz.</p></section>
    <section className="chat-panel" aria-label="Chatbot de propósito general">
      <div className="chat-toolbar"><label>Modelo<select value={model} disabled={!catalog || busy || listening} onChange={e => { reset(); setModel(e.target.value); }}>
        {(catalog?.models || [{ id: 'openrouter/free', name: 'Cargando modelos…' }]).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select></label><button disabled={busy} onClick={reset}>Nueva conversación</button></div>
      <p className="chat-note">Las opciones son gratuitas y tienen límites de uso y disponibilidad. Los mensajes se envían a OpenRouter y al proveedor elegido. El historial se borra al salir de esta página. El dictado puede enviar audio al servicio de reconocimiento del navegador.</p>
      {catalog && !catalog.configured && <p role="status" className="auth-message">Chatbot pendiente de activación: falta configurar la API key del proveedor en el servidor.</p>}
      <div className="chat-history" ref={transcript} role="log" aria-label="Conversación" aria-live="polite" aria-busy={busy}>
        {!messages.length && <p className="chat-empty">¿En qué te puedo ayudar? Escribí tu primer mensaje abajo.</p>}
        {messages.map((m, i) => <article key={i} className={`chat-turn ${m.role}`}><strong>{m.role === 'user' ? 'Vos' : 'Asistente'}</strong><p>{m.content}</p>{m.model && <small>{m.model}</small>}</article>)}
        {busy && <p role="status">Esperando la respuesta del modelo…</p>}
      </div>
      {error && <p role="alert" className="auth-message">{error}</p>}
      <form onSubmit={submit}><label htmlFor="chat-message">Tu mensaje</label>
        <textarea id="chat-message" value={text} maxLength={4000} rows={3} disabled={busy} onChange={e => setText(e.target.value)} placeholder="Escribí aquí…" />
        <div className="chat-actions"><span>{text.length}/4000</span>
          {Recognition ? <button type="button" disabled={busy} aria-pressed={listening} onClick={dictate}>{listening ? 'Detener dictado' : '🎤 Dictar'}</button> : <small>Dictado no disponible en este navegador.</small>}
          <button type="submit" disabled={busy || listening || !text.trim() || !catalog?.configured}>{busy ? 'Respondiendo…' : 'Enviar'}</button></div>
      </form>
      {speech && <div className="chat-voice"><label><input type="checkbox" checked={readAloud} onChange={e => { setReadAloud(e.target.checked); if (!e.target.checked) speech.cancel(); }} /> Leer respuestas en voz alta</label><button onClick={() => speech.cancel()}>Detener audio</button></div>}
    </section>
  </>;
}

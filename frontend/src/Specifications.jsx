import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { specifications } from './specifications.js';

// Tokens are always React text, never executable markup from a specification.
function SourceLine({ text }) {
  const parts = text.split(/(`[^`]*`|#[\da-fA-F]{6,8}\b|https?:\/\/[^\s)]+|\*\*[^*]+\*\*|\bR\d+(?:–R?\d+)?\b)/g);
  return <span className={`specifications__line${/^#{1,6} /.test(text) ? ' specifications__line--heading' : ''}`}>
    {parts.map((part, i) => {
      if (!(i % 2)) return part;
      const kind = part.startsWith('`') ? 'code' : part.startsWith('#') ? 'color' : part.startsWith('http') ? 'url' : part.startsWith('**') ? 'strong' : 'requirement';
      return <span key={i} className={`specifications__token specifications__token--${kind}`}>{part}</span>;
    })}{text === '' ? '\n' : ''}
  </span>;
}

export default function Specifications({ catalog = specifications }) {
  const [params, setParams] = useSearchParams();
  const requested = params.get('file');
  const selected = catalog.find(file => file.path === requested) ?? catalog.find(file => file.path === 'specs/requirements.md') ?? catalog[0];
  const unknown = requested && !catalog.some(file => file.path === requested);
  const [filter, setFilter] = useState('');
  const [size, setSize] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState('');
  const content = result?.path === selected?.path && result?.attempt === attempt ? result : null;
  const sizes = ['small', 'normal', 'large', 'largest'];

  useEffect(() => {
    let current = true;
    setFeedback('');
    if (selected) Promise.resolve().then(() => selected.read()).then(
      text => { if (current) setResult({ path: selected.path, attempt, text }); },
      () => { if (current) setResult({ path: selected.path, attempt, error: true }); },
    );
    return () => { current = false; };
  }, [selected, attempt]);

  const copy = async () => {
    const path = selected.path;
    try {
      await navigator.clipboard.writeText(content.text);
      setFeedback({ path, message: 'Complete source copied.' });
    } catch {
      setFeedback({ path, message: 'Copy is unavailable. Use Download .md to save the complete source.' });
    }
  };
  const download = () => {
    let url, anchor;
    try {
      url = URL.createObjectURL(new Blob([content.text], { type: 'text/markdown;charset=utf-8' }));
      anchor = document.createElement('a');
      anchor.href = url; anchor.download = selected.path.split('/').at(-1);
      document.body.appendChild(anchor); anchor.click();
      setFeedback({ path: selected.path, message: 'Download requested for the complete source.' });
    } catch {
      setFeedback({ path: selected.path, message: 'Download could not start. Try Copy source or retry.' });
    } finally {
      anchor?.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  return <>
    <section className="page-intro"><p className="text__eyebrow">SDD · SYSTEM DOCUMENTATION</p>
      <h1 className="page-intro__title" tabIndex={-1}>Specifications.</h1>
      <p className="page-intro__subtitle">Read every system specification, including requirements, architecture, design and acceptance criteria.</p>
    </section>
    <aside className="notice">Read-only snapshot bundled with this application build. New deployments include the specifications from their source branch. Older sections may describe historical versions and environments. The original text is preserved; line numbers are display-only.</aside>
    <section className="panel specifications" aria-label="System specifications">
      <div className="specifications__layout">
        <aside className="specifications__files" aria-label="Specification files">
          <label className="specifications__filter">Filter files<input className="field specifications__filter-input" type="search" value={filter} onChange={event => setFilter(event.target.value)} placeholder="e.g. design-system" /></label>
          <p className="specifications__count">{catalog.length} specification files</p>
          <ul className="specifications__file-list">{catalog.filter(file => file.path.toLowerCase().includes(filter.toLowerCase())).map(file => <li key={file.path}>
            <button className="button specifications__file" type="button" aria-pressed={selected?.path === file.path} onClick={() => setParams({ file: file.path })}>{file.path}</button>
          </li>)}</ul>
          {!catalog.filter(file => file.path.toLowerCase().includes(filter.toLowerCase())).length && <p className="specifications__hint">No matching files. Clear the filter to show all files.</p>}
        </aside>
        <div className="specifications__document">
          {unknown && <p className="notice notice--warning" role="status">Unknown specification. Showing the default file.</p>}
          {!selected ? <p className="specifications__hint">No specification files are included in this build.</p> : <>
            <h2 className="specifications__filename">{selected.path}</h2>
            <div className="specifications__toolbar" role="group" aria-label="Source controls">
              <button className="button" type="button" aria-label="Decrease text size" disabled={size === 0} onClick={() => setSize(value => value - 1)}>A−</button>
              <button className="button" type="button" aria-label="Increase text size" disabled={size === sizes.length - 1} onClick={() => setSize(value => value + 1)}>A+</button>
              <button className="button" type="button" disabled={!content || content.error} onClick={copy}>Copy source</button>
              <button className="button" type="button" disabled={!content || content.error} onClick={download}>Download .md</button>
            </div>
            <p className="specifications__feedback" role="status">{feedback?.path === selected.path ? feedback.message : ''}</p>
            {!content && <p className="specifications__hint" role="status">Loading specification…</p>}
            {content?.error && <div className="notice notice--error" role="alert">Could not load this specification. <button className="button" type="button" onClick={() => setAttempt(value => value + 1)}>Retry specification</button></div>}
            {content && !content.error && <pre className={`specifications__source specifications__source--${sizes[size]}`} aria-label={`Source of ${selected.path}`}><code>{content.text.split('\n').map((line, index) => <SourceLine key={index} text={line} />)}</code></pre>}
          </>}
        </div>
      </div>
    </section>
  </>;
}

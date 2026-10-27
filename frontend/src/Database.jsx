import React, { useEffect, useRef, useState } from 'react';
import { loadDatabase, loadTable } from './databaseClient.js';

function TableView({ schema, table }) {
  const [open, setOpen] = useState(false), [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [expanded, setExpanded] = useState(new Set());
  const active = useRef(null), mounted = useRef(false), failedOffset = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; active.current?.abort(); }; }, []);
  async function load(offset = 0) {
    active.current?.abort(); const controller = new AbortController(); active.current = controller;
    setLoading(true); setError(''); failedOffset.current = offset;
    try {
      const data = await loadTable(schema, table, offset, controller.signal);
      if (controller.signal.aborted || !mounted.current || active.current !== controller) return;
      if (offset && JSON.stringify(data.columns) !== JSON.stringify(page.columns)) throw new Error('The table columns changed. Refresh the rows.');
      setPage(current => offset ? { ...data, rows: [...current.rows, ...data.rows] } : data);
      if (!offset) setExpanded(new Set());
    } catch (e) {
      if (mounted.current && !controller.signal.aborted && active.current === controller) setError(e.name === 'AbortError' ? 'The backend took too long. Please retry.' : e.message);
    } finally { if (mounted.current && active.current === controller) setLoading(false); }
  }
  function toggle() {
    if (open) { active.current?.abort(); setLoading(false); }
    else if (!page) load();
    setOpen(value => !value);
  }
  function toggleRow(position) {
    setExpanded(current => { const next = new Set(current); next.has(position) ? next.delete(position) : next.add(position); return next; });
  }
  return <li className="database__table">
    <div className="database__table-heading"><h3>{table}</h3>
      <button className="button database__toggle" type="button" aria-expanded={open}
        aria-label={`${open ? 'Collapse' : 'Expand'} table ${schema}.${table}`} onClick={toggle}>{open ? '−' : '+'}</button></div>
    {open && <div className="database__table-content">
      <div className="database__table-tools"><p>{page ? `Order: ${page.ordering}` : 'Rows load when you expand a table.'}</p>
        <button className="button" type="button" disabled={loading} onClick={() => load()}>Refresh rows</button></div>
      {error && <p role="alert" className="notice notice--warning">{error} <button className="button" type="button" disabled={loading} onClick={() => load(failedOffset.current)}>Retry rows</button></p>}
      <p role="status" className="database__status">{loading ? 'Loading rows…' : page ? `${page.rows.length} rows loaded` : ''}</p>
      {page && !page.rows.length && <p className="database__empty">This table has no rows.</p>}
      {page && <ul className="database__rows" aria-label={`Rows in ${schema}.${table}`} aria-busy={loading}>
        {page.rows.map(row => <li key={row.position}>
          <div className="database__row-heading"><span>{row.label}</span>
            <button className="button database__toggle" type="button" aria-expanded={expanded.has(row.position)}
              aria-label={`${expanded.has(row.position) ? 'Collapse' : 'Expand'} row ${row.position + 1} in ${schema}.${table}`}
              onClick={() => toggleRow(row.position)}>{expanded.has(row.position) ? '−' : '+'}</button></div>
          {expanded.has(row.position) && <dl className="database__columns" aria-label={`Columns in row ${row.position + 1}`}>
            {page.columns.map((column, index) => <div key={column.name}>
              <dt>{column.name} <small>{column.type}{column.primaryKey ? ' · primary key' : ''}</small></dt>
              <dd>{row.cells[index].value === null ? <span className="database__null">NULL</span>
                : row.cells[index].value === '' ? <span className="database__null">(empty string)</span>
                : <pre>{row.cells[index].value}</pre>}
                {row.cells[index].truncated && <small className="database__truncated">Value truncated to 65,536 characters.</small>}</dd>
            </div>)}
          </dl>}
        </li>)}
      </ul>}
      {page?.nextOffset != null && <button className="button" type="button" disabled={loading} onClick={() => load(page.nextOffset)}>Load more rows</button>}
      <p className="database__hint">Read-only snapshot. Refresh to see changes made since these rows were loaded.</p>
    </div>}
  </li>;
}

export default function Database() {
  const [catalog, setCatalog] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [generation, setGeneration] = useState(0);
  const active = useRef(null), mounted = useRef(false);
  async function refresh() {
    active.current?.abort(); const controller = new AbortController(); active.current = controller;
    setLoading(true); setError('');
    try {
      const data = await loadDatabase(controller.signal);
      if (!mounted.current || controller.signal.aborted || active.current !== controller) return;
      setCatalog(data); setGeneration(value => value + 1);
    } catch (e) { if (mounted.current && !controller.signal.aborted && active.current === controller) setError(e.name === 'AbortError' ? 'The backend took too long. Please retry.' : e.message); }
    finally { if (mounted.current && active.current === controller) setLoading(false); }
  }
  useEffect(() => { mounted.current = true; refresh(); return () => { mounted.current = false; active.current?.abort(); }; }, []);
  return <>
    <section className="page-intro"><p className="text__eyebrow">POSTGRESQL · READ-ONLY EXPLORER</p><h1 className="page-intro__title" tabIndex={-1}>Database.</h1>
      <p className="page-intro__subtitle">Explore schemas and tables. Expand a table to see its rows, then expand a row to inspect every column.</p></section>
    <section className="panel database__panel" aria-label="Database explorer">
      <div className="database__toolbar"><p>{catalog ? <>Database <strong>{catalog.database}</strong></> : 'Connected PostgreSQL database'}</p>
        <button className="button" type="button" disabled={loading} onClick={refresh}>Refresh tables</button></div>
      {error && <p role="alert" className="notice notice--warning">{error} <button className="button" type="button" onClick={refresh}>Retry database</button></p>}
      <p role="status" className="database__status">{loading ? 'Loading schemas and tables…' : catalog ? `${catalog.schemas.reduce((n, schema) => n + schema.tables.length, 0)} tables across ${catalog.schemas.length} schemas` : ''}</p>
      {catalog && !catalog.schemas.length && <p className="database__empty">No accessible tables were found.</p>}
      {catalog?.schemas.map(schema => <section key={schema.name} className="database__schema" aria-label={`Schema ${schema.name}`}>
        <h2><small>SCHEMA</small> {schema.name}</h2>
        <ul className="database__tables">{schema.tables.map(table => <TableView key={`${generation}:${table.name}`} schema={schema.name} table={table.name} />)}</ul>
      </section>)}
    </section>
  </>;
}

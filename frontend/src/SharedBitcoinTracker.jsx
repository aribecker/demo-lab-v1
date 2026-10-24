import React, { useEffect, useRef, useState } from 'react';
import { BitcoinWidget } from './BitcoinTracker.jsx';
import SimulationPanel from './SimulationPanel.jsx';
import useSharedSimulation from './useSharedSimulation.js';
import { validLimits, validRun } from './simulation.js';

const formFrom = s => ({ capital: String(s.capital), fee: String(s.feePercent),
  minimum: s.minimum == null ? '' : String(s.minimum), maximum: s.maximum == null ? '' : String(s.maximum), step: String(s.step) });
const numeric = value => value.trim() ? Number(value) : NaN;

export default function SharedBitcoinTracker({ api }) {
  const shared = useSharedSimulation(api);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const draftVersion = useRef(0);
  useEffect(() => { if (shared.data && !dirty) setDraft(formFrom(shared.data.settings)); }, [shared.data, dirty]);
  const edit = key => value => { draftVersion.current++; setDirty(true); setDraft(old => ({ ...old, [key]: value })); };
  const commit = async (key, value) => {
    const field = key === 'fee' ? 'feePercent' : key;
    if (!Number.isFinite(numeric(value))) return;
    if (shared.data?.settings[field] === numeric(value)) return;
    const version = draftVersion.current;
    const ok = await shared.send('settings', { changes: { [field]: numeric(value) } });
    if (ok && version === draftVersion.current) setDirty(false);
  };
  const start = async () => {
    const version = draftVersion.current;
    const changes = { capital: numeric(draft.capital), feePercent: numeric(draft.fee), step: numeric(draft.step) };
    if (draft.minimum !== '' || draft.maximum !== '') { changes.minimum = numeric(draft.minimum); changes.maximum = numeric(draft.maximum); }
    if (await shared.send('reset', { changes }) && version === draftVersion.current) setDirty(false);
  };
  const data = shared.data;
  return <>
    <section className="intro" aria-labelledby="page-heading"><p className="eyebrow">ONE SHARED SIMULATION · VIRTUAL FUNDS</p>
      <h1 id="page-heading" tabIndex={-1}>Bitcoin <span>tracker.</span></h1>
      <p className="subtitle">The same saved balances, controls and run state on every device. Opening this page never restarts the simulation.</p></section>
    <aside className="shared-notice"><strong>Shared demo: controls affect everyone.</strong> Quotes, thresholds and virtual orders are processed on the server. Closing this page does not pause the engine.
      {data?.execution?.hostingMode === 'always-on'
        ? ' Always-on hosting is configured. The engine works without open browsers while the service and database are available.'
        : ' This deployment uses sleep-capable hosting: Render Free stops processing after idle suspension. Continuous unattended operation requires an always-on plan.'}
    </aside>
    {shared.error && <p role="alert" className="shared-error">{shared.error}{data ? ' Showing the last known shared state.' : ' No local session has been started.'}</p>}
    {!data || !draft ? <section className="bitcoin-card" aria-label="Shared simulation connection"><p role="status">Connecting to the saved simulation… The free backend may take a minute to wake up.</p></section> : <>
      <p className="bitcoin-note">Shared state revision {data.revision} · {data.running ? 'Tracking enabled' : 'Paused for everyone'} · Last server quote: {data.lastPollAt ? new Date(data.lastPollAt).toLocaleString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'Waiting for the server'} · Times in Buenos Aires{shared.pending ? ' · Saving shared action…' : ''}</p>
      {data.execution && <p className="bitcoin-note">Backend engine: {data.execution.schedulingEnabled ? data.execution.lastCycleStatus : 'disabled'} · Last scheduler cycle: {data.execution.lastCycleAt
        ? new Date(data.execution.lastCycleAt).toLocaleString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'Waiting'} · Target interval: {data.execution.pollIntervalMs / 1000}s</p>}
      {data.running && data.lastPollAt > 0 && Date.now() - data.lastPollAt > 30000 && <p className="shared-error">The last server quote is over 30 seconds old. The backend may be waking up or its provider may be unavailable. Balances are the last saved state.</p>}
      <div className="bitcoin-workspace"><BitcoinWidget minimum={data.settings.minimum} maximum={data.settings.maximum}
        tracker={{ ...data, shared: true, visible: true, pending: shared.pending,
          toggle: () => shared.send('running', { running: !data.running }), refresh: () => shared.send('refresh') }} />
        <SimulationPanel simulation={data.simulation} latest={data.samples.at(-1)} start={start}
          valid={validRun(numeric(draft.capital), numeric(draft.fee)) && numeric(draft.step) > 0}
          limitsValid={validLimits(numeric(draft.minimum), numeric(draft.maximum))}
          autoLimits={data.settings.minimum == null && draft.minimum === '' && draft.maximum === ''}
          settings={{ ...draft, setCapital: edit('capital'), setFee: edit('fee'), setMinimum: edit('minimum'), setMaximum: edit('maximum'), setStep: edit('step') }}
          shared onCommit={commit} />
      </div>
      {dirty && <p className="bitcoin-note">You have input drafts. Valid edits save on leaving a field; +/− applies immediately. Invalid drafts are not applied to the shared engine.</p>}
    </>}
  </>;
}


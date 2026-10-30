import React, { useEffect, useRef, useState } from 'react';
import SimulationPanel from './SimulationPanel.jsx';
import useSharedSimulation from './useSharedSimulation.js';
import { validLimits, validRun } from './simulation.js';
import AdaptiveTracking, { AdaptiveSettings, adaptiveDefaults, adaptiveFields } from './AdaptiveTracking.jsx';
import GomezTracking, { GomezSettings, gomezDefaults, validGomez } from './GomezTrading.jsx';

const formFrom = s => ({ ...Object.fromEntries(Object.entries({ ...adaptiveDefaults, ...gomezDefaults }).map(([key, value]) => [key, String(s[key] ?? value)])), capital: String(s.capital), fee: String(s.feePercent),
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
    const parsed=key === 'strategy' ? value : numeric(value);
    if (key !== 'strategy' && !Number.isFinite(parsed)) return;
    if (shared.data?.settings[field] === parsed) return;
    const version = draftVersion.current;
    const ok = await shared.send('settings', { changes: { [field]: parsed } });
    if (ok && version === draftVersion.current) setDirty(false);
  };
  const start = async () => {
    const version = draftVersion.current;
    const changes = { capital: numeric(draft.capital), feePercent: numeric(draft.fee), step: numeric(draft.step) };
    changes.strategy=draft.strategy;
    if (draft.strategy === 'gomez') {
      changes.initialAction = draft.initialAction; changes.initialBtc = numeric(draft.initialBtc);
      changes.delta = numeric(draft.delta); changes.deltaUnit = draft.deltaUnit; changes.pollSeconds = numeric(draft.pollSeconds);
    }
    for (const [key] of adaptiveFields) changes[key]=numeric(draft[key]);
    if (draft.minimum !== '' || draft.maximum !== '') { changes.minimum = numeric(draft.minimum); changes.maximum = numeric(draft.maximum); }
    if (await shared.send('reset', { changes }) && version === draftVersion.current) setDirty(false);
  };
  const data = shared.data;
  return <>
    <section className="page-intro" aria-labelledby="page-heading"><p className="text__eyebrow">ONE SHARED SIMULATION · VIRTUAL FUNDS</p>
      <h1 className="page-intro__title" id="page-heading" tabIndex={-1}>Trading <span>Simulator.</span></h1>
      <p className="page-intro__subtitle">The same saved balances, controls and run state on every device. Opening this page never restarts the simulation.</p></section>
    <p className="bitcoin__note"><a className="text__link" href="/login">Open login demo →</a> · Access follows the configured group memberships, including Everyone when enabled. Login and logout do not reset its saved state.</p>
    <aside className="notice"><strong>Owner-only demo · virtual funds.</strong> Quotes, thresholds and virtual orders are processed on the server. Closing this page does not pause the engine.
      {data?.execution?.hostingMode === 'always-on'
        ? ' Always-on hosting is configured. The engine works without open browsers while the service and database are available.'
        : ' This deployment uses sleep-capable hosting: Render Free stops processing after idle suspension. Continuous unattended operation requires an always-on plan.'}
    </aside>
    {shared.error && <p role="alert" className="notice notice--error">{shared.error}{data ? ' Showing the last known shared state.' : ' No local session has been started.'}</p>}
    {!data || !draft ? <section className="panel bitcoin__panel" aria-label="Shared simulation connection"><p role="status">Connecting to the saved simulation… The free backend may take a minute to wake up.</p></section> : <>
      <p className="bitcoin__note">Shared state revision {data.revision} · {data.running ? 'Tracking enabled' : 'Paused for everyone'} · Last server quote: {data.lastPollAt ? new Date(data.lastPollAt).toLocaleString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'Waiting for the server'} · Times in Buenos Aires{shared.pending ? ' · Saving shared action…' : ''}</p>
      {data.execution && <p className="bitcoin__note">Backend engine: {data.execution.schedulingEnabled ? data.execution.lastCycleStatus : 'disabled'} · Last scheduler cycle: {data.execution.lastCycleAt
        ? new Date(data.execution.lastCycleAt).toLocaleString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'Waiting'} · Target interval: {data.execution.pollIntervalMs / 1000}s</p>}
      {data.simulation.strategy !== 'gomez' && data.running && data.lastPollAt > 0 && Date.now() - data.lastPollAt > 30000 && <p className="notice notice--error">The last server quote is over 30 seconds old. The backend may be waking up or its provider may be unavailable. Balances are the last saved state.</p>}
      {data.simulation.strategy === 'gomez' ? <GomezTracking data={data} send={shared.send} pending={shared.pending} /> : <AdaptiveTracking data={data} />}
      <p className="bitcoin__note"><a className="text__link" href="/bitcoin">Open Bitcoin Tracker →</a></p>
      <div className="bitcoin__actions"><button className="button" disabled={shared.pending} onClick={()=>shared.send('running',{running:!data.running})}>{data.running?'Pause tracking':'Resume tracking'}</button>
        <button className="button" disabled={shared.pending||!data.running} onClick={()=>shared.send('refresh')}>Refresh now</button></div>
      <div className="simulation__workspace">
        <SimulationPanel simulation={data.simulation} runMetrics={data.runMetrics} latest={data.samples.at(-1)} start={start}
          valid={!shared.pending && validRun(numeric(draft.capital), numeric(draft.fee)) && (draft.strategy !== 'gomez' || validGomez(draft) && numeric(draft.initialBtc) > 0 && numeric(draft.initialBtc) <= 1e6) && numeric(draft.step) > 0 && adaptiveFields.every(([key]) => {
            const value=numeric(draft[key]); return Number.isFinite(value) && value >= (key === 'minimumMovePercent' ? 0.01 : 0.1) && value <= (key === 'minimumMovePercent' ? 10 : 20);
          })}
          limitsValid={validLimits(numeric(draft.minimum), numeric(draft.maximum))}
          autoLimits={data.settings.minimum == null && draft.minimum === '' && draft.maximum === ''}
          settings={{ ...draft, setCapital: edit('capital'), setFee: edit('fee'), setMinimum: edit('minimum'), setMaximum: edit('maximum'), setStep: edit('step') }}
          strategySettings={<><AdaptiveSettings draft={draft} edit={edit} commit={commit} pending={shared.pending} />{draft.strategy === 'gomez' && <GomezSettings draft={draft} edit={edit} />}</>}
          shared onCommit={commit} />
      </div>
      {dirty && <p className="bitcoin__note">You have input drafts. Valid edits save on leaving a field; +/− applies immediately. Invalid drafts are not applied to the shared engine.</p>}
    </>}
  </>;
}


import { useCallback, useEffect, useRef, useState } from 'react';
import { readSimulation, sendSimulationCommand } from './simulationClient.js';

export default function useSharedSimulation(api = { read: readSimulation, command: sendSimulationCommand }) {
  const read = api.read, command = api.command;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(0);
  const current = useRef(null);
  const mounted = useRef(false);
  const queue = useRef(Promise.resolve());
  const accept = useCallback(snapshot => {
    if (!mounted.current || (current.current && snapshot.revision < current.current.revision)) return;
    current.current = snapshot; setData(snapshot);
  }, []);

  useEffect(() => {
    mounted.current = true;
    let active = true, inFlight = null;
    const update = async () => {
      if (!active || inFlight || document.visibilityState === 'hidden') return;
      inFlight = new AbortController();
      try { accept(await read({ signal: inFlight.signal })); if (active) setError(''); }
      catch (failure) { if (active) setError(failure.message || 'Unable to read the shared simulation.'); }
      finally { inFlight = null; }
    };
    update();
    const interval = setInterval(update, 3000);
    const visibility = () => { if (document.visibilityState !== 'hidden') update(); };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      active = false; mounted.current = false; inFlight?.abort(); clearInterval(interval);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [read, accept]);

  const send = useCallback((type, fields = {}) => {
    if (!current.current) return Promise.resolve(false);
    setPending(old => old + 1);
    const id = crypto.randomUUID();
    const operation = queue.current.then(async () => {
      try {
        const snapshot = await command({ id, type, expectedControlRevision: current.current.controlRevision, ...fields });
        accept(snapshot); if (mounted.current) setError(''); return true;
      } catch (failure) {
        if (mounted.current) setError(failure.status === 409
          ? 'Another view changed the shared controls. Review the current values before trying again.'
          : failure.status === 400 ? `Settings were not saved: ${failure.message}`
            : 'The action could not be confirmed. Reconnecting to the saved server state before another action.');
        try { accept(await read()); } catch { /* Retain known state and visible connection error. */ }
        return false;
      } finally { if (mounted.current) setPending(old => old - 1); }
    });
    queue.current = operation.catch(() => {});
    return operation;
  }, [command, read, accept]);

  return { data, error, pending: pending > 0, send };
}

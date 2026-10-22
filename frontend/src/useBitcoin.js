import { useEffect, useRef, useState } from 'react';
import { loadBitcoin } from './bitcoinClient.js';

export const POLL_MS = 10_000;
export const MAX_SAMPLES = 180;
export const appendSample = (samples, quote) => [...samples, quote].slice(-MAX_SAMPLES);

export default function useBitcoin(loader = loadBitcoin) {
  const [running, setRunning] = useState(true);
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  const [samples, setSamples] = useState([]);
  const [baseline, setBaseline] = useState(null);
  const [range, setRange] = useState(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [generation, setGeneration] = useState(0);
  const refresh = useRef(() => {});

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!running || !visible) { setPending(false); return; }
    let active = true;
    let flight = null;
    let timeout;
    const update = async () => {
      if (!active || flight) return;
      const controller = new AbortController();
      flight = controller;
      setPending(true);
      let timedOut = false;
      timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 8000);
      try {
        const quote = await loader({ signal: controller.signal });
        if (!active || controller.signal.aborted) return;
        setSamples(old => appendSample(old, quote));
        setBaseline(old => old ?? quote.price);
        setRange(old => ({ min: Math.min(old?.min ?? quote.price, quote.price), max: Math.max(old?.max ?? quote.price, quote.price) }));
        setCount(old => old + 1);
        setError('');
      } catch (failure) {
        if (active) setError(timedOut ? 'Quote request timed out. Waiting for the next refresh.'
          : failure instanceof Error ? failure.message : 'Unable to retrieve a quote.');
      } finally {
        clearTimeout(timeout);
        flight = null;
        if (active) setPending(false);
      }
    };
    refresh.current = update;
    update();
    const interval = setInterval(update, POLL_MS);
    return () => {
      active = false;
      refresh.current = () => {};
      clearInterval(interval);
      clearTimeout(timeout);
      flight?.abort();
    };
  }, [running, visible, loader, generation]);

  return { running, visible, samples, baseline, range, count, error, pending,
    toggle: () => setRunning(old => !old), refresh: () => refresh.current(),
    reset: () => {
      setSamples([]); setBaseline(null); setRange(null); setCount(0); setError('');
      setRunning(true); setGeneration(old => old + 1);
    } };
}

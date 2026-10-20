import { useCallback, useEffect, useRef, useState } from 'react';
import { weatherPresentation } from './weatherPresentation.js';

const loadingState = { phase: 'loading', result: null, error: null };

export function useWeather() {
  const [state, setState] = useState(loadingState);
  const active = useRef(null);
  const generation = useRef(0);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    if (!mounted.current || active.current) return;
    const controller = new AbortController();
    const requestId = ++generation.current;
    active.current = controller;
    setState(loadingState);
    const isCurrent = () => mounted.current
      && generation.current === requestId && !controller.signal.aborted;
    try {
      const response = await fetch('/api/hello', {
        cache: 'no-store', signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const result = weatherPresentation(data);
      if (isCurrent()) setState({ phase: 'success', result, error: null });
    } catch (error) {
      if (isCurrent()) setState({ phase: 'error', result: null, error: error.message });
    } finally {
      if (active.current === controller) active.current = null;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
      generation.current++;
      active.current?.abort();
      active.current = null;
    };
  }, [refresh]);

  return { ...state, refresh };
}

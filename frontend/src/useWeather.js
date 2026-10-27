import { useCallback, useEffect, useRef, useState } from 'react';
import { loadWeather } from './weatherClient.js';

export function useWeather(loader = loadWeather) {
  const [state, setState] = useState({ phase: 'loading', message: 'Contacting the weather service…' });
  const generation = useRef(0);
  const active = useRef(false);
  const controller = useRef(null);

  const refresh = useCallback(async () => {
    if (active.current) return;
    active.current = true;
    const id = ++generation.current;
    controller.current = new AbortController();
    setState({ phase: 'loading', message: 'Contacting the weather service…' });
    try {
      const data = await loader({
        signal: controller.current.signal,
        onProgress: message => {
          if (id === generation.current) setState({ phase: 'loading', message });
        },
      });
      if (id === generation.current) setState({ phase: 'success', data, message: 'Weather updated. Ready for another request.' });
    } catch (error) {
      if (id === generation.current && error.name !== 'AbortError') {
        setState({ phase: 'error', message: error.message || 'Weather is unavailable. Please try again.', requestId: error.requestId });
      }
    } finally {
      if (id === generation.current) active.current = false;
    }
  }, [loader]);

  useEffect(() => {
    refresh();
    return () => {
      generation.current += 1;
      controller.current?.abort();
      active.current = false;
    };
  }, [refresh]);

  return { ...state, refresh };
}

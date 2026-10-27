import React, { StrictMode } from 'react';
import { act, fireEvent, render as renderDom, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { sample } from './fixture.js';
import { MemoryRouter } from 'react-router';

const render = element => element.type === StrictMode
  ? renderDom(<StrictMode><MemoryRouter initialEntries={['/weather']}>{element.props.children}</MemoryRouter></StrictMode>)
  : renderDom(<MemoryRouter initialEntries={['/weather']}>{element}</MemoryRouter>);

describe('React weather page', () => {
  it('loads on mount and displays weather, attribution, times and the actual React version', async () => {
    const loader = vi.fn().mockResolvedValue(sample);
    render(<App loader={loader} />);
    expect(screen.getByRole('button', { name: /Get weather|Getting weather/ })).toBeDisabled();
    expect(screen.getByRole('region', { name: 'Buenos Aires weather' })).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findByText('current model data')).toBeInTheDocument();
    expect(screen.getByText('Feels like 20.1 °C')).toBeInTheDocument();
    expect(screen.getByText(sample.requestId)).toBeInTheDocument();
    expect(screen.getByText('20 Oct 2026, 09:00:00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open-Meteo ↗' })).toHaveAttribute('href', sample.providerUrl);
    expect(screen.getByText(`React ${React.version}`)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('button', { name: /Get weather/ })).toBeEnabled();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('refreshes once, clears stale values and prevents duplicate interactions while pending', async () => {
    let finish;
    const loader = vi.fn().mockResolvedValueOnce(sample)
      .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const { container } = render(<App loader={loader} />);
    await screen.findByText('current model data');
    fireEvent.click(screen.getByRole('button', { name: /Get weather|Getting weather/ }));
    expect(screen.queryByText(sample.requestId)).not.toBeInTheDocument();
    expect(container.querySelector('.weather-widget__readings')).toBeInTheDocument();
    expect(container.querySelectorAll('.weather-widget__metadata > div')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Get weather|Getting weather/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Get weather|Getting weather/ }));
    expect(loader).toHaveBeenCalledTimes(2);
    await act(() => finish({ ...sample, temperatureC: 23 }));
    expect(screen.getByRole('button', { name: /Get weather|Getting weather/ })).toBeEnabled();
    expect(screen.getByText('current model data')).toBeInTheDocument();
  });

  it('shows readable errors and allows manual retry', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('Providers are unavailable. Please try again.')).mockResolvedValueOnce(sample);
    render(<App loader={loader} />);
    expect(await screen.findByText('Providers are unavailable. Please try again.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Get weather|Getting weather/ }));
    await screen.findByText('current model data');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('shows wake-up progress during a cold start', async () => {
    let progress;
    const loader = vi.fn(options => { progress = options.onProgress; return new Promise(() => {}); });
    render(<App loader={loader} />);
    act(() => progress('Waking the weather service… retrying (attempt 2).'));
    expect(screen.getByRole('status')).toHaveTextContent('Waking the weather service');
    expect(screen.getByRole('button', { name: /Get weather|Getting weather/ })).toBeDisabled();
  });

  it('labels forecasts and omits a null feels-like temperature', async () => {
    const loader = vi.fn().mockResolvedValue({ ...sample, feelsLikeC: null, provider: 'MET Norway',
      providerUrl: 'https://www.met.no/', dataType: 'nearest-hour forecast' });
    render(<App loader={loader} />);
    await screen.findByText('nearest-hour forecast');
    expect(screen.queryByText(/Feels like .*°C/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'MET Norway ↗' })).toHaveAttribute('href', 'https://www.met.no/');
  });

  it('renders external error strings as text', async () => {
    const message = '<img src=x onerror=alert(1)>';
    const { container } = render(<App loader={vi.fn().mockRejectedValue(new Error(message))} />);
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('aborts on unmount and ignores an obsolete strict-mode lifecycle result', async () => {
    const requests = [];
    const loader = vi.fn(options => new Promise(resolve => requests.push({ ...options, resolve })));
    const view = render(<StrictMode><App loader={loader} /></StrictMode>);
    expect(requests).toHaveLength(2);
    expect(requests[0].signal.aborted).toBe(true);
    await act(() => requests[1].resolve(sample));
    await act(() => {
      requests[0].onProgress('Obsolete progress');
      requests[0].resolve({ ...sample, dataType: 'Obsolete result' });
    });
    expect(screen.getByText('current model data')).toBeInTheDocument();
    expect(screen.queryByText(/Obsolete/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Get weather|Getting weather/ }));
    await waitFor(() => expect(requests).toHaveLength(3));
    view.unmount();
    expect(requests[2].signal.aborted).toBe(true);
  });
});


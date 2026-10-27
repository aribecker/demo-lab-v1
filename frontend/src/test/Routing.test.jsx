import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { sample } from './fixture.js';
import { sharedSnapshot } from './sharedFixture.js';
import * as peopleClient from '../peopleClient.js';
import * as chatClient from '../chatClient.js';

afterEach(() => vi.useRealTimers());

function HistoryControls() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate(-1)}>Browser back</button><button onClick={() => navigate(1)}>Browser forward</button></>;
}

function open(path = '/', loader = vi.fn().mockResolvedValue(sample), history = false) {
  const view = render(<MemoryRouter initialEntries={[path]}><App loader={loader} authApi={{initialize:async()=>null,profile:async()=>null}} />{history && <HistoryControls />}</MemoryRouter>);
  return { ...view, loader };
}

function menuLink(name) {
  fireEvent.click(screen.getByRole('button', { name: 'Menu', exact: true }));
  return screen.getByRole('link', { name, exact: true });
}

it('opens the integrated chatbot and exposes activation status without touching trading', async () => {
  vi.spyOn(chatClient,'loadModels').mockResolvedValue({configured:false,models:[{id:'openrouter/free',name:'Automático gratis'}]});
  const command=vi.fn();
  render(<MemoryRouter initialEntries={['/chatbot']}><App simulationApi={{read:vi.fn(),command}}/></MemoryRouter>);
  expect(await screen.findByText(/pendiente de activación/)).toBeInTheDocument();
  expect(menuLink('Chatbot')).toHaveAttribute('aria-current','page');
  expect(command).not.toHaveBeenCalled();
});

it('opens the unified People route and marks its menu destination', async () => {
  vi.spyOn(peopleClient,'listPeople').mockResolvedValue({people:[],nextCursor:null});
  open('/people');
  expect(await screen.findByText('No people yet. Add the first person.')).toBeInTheDocument();
  expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Hello, database!');
  expect(menuLink('People')).toHaveAttribute('aria-current','page');
});

describe('routed demo application', () => {
  it('starts at an introduction with feature links and no live weather request', () => {
    const { loader } = open();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Small features.Real connections.');
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    expect(screen.getByRole('link', { name: /Open Weather demo/ })).toHaveAttribute('href', '/weather');
    expect(screen.getByRole('link', { name: /Open Component gallery/ })).toHaveAttribute('href', '/components');
    expect(screen.getByRole('link', { name: /Open Login/ })).toHaveAttribute('href', '/login');
    expect(loader).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Buenos Aires weather' })).not.toBeInTheDocument();
    expect(menuLink('Home')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Weather demo', exact: true })).not.toHaveAttribute('aria-current');
  });

  it('navigates through the menu, focuses headings and preserves an already active weather route', async () => {
    const { loader } = open();
    fireEvent.click(menuLink('Weather demo'));
    await screen.findByText(sample.requestId);
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(menuLink('Weather demo')).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('link', { name: 'Weather demo', exact: true }));
    expect(loader).toHaveBeenCalledTimes(1);
    expect(screen.getByText(sample.requestId)).toBeInTheDocument();
    fireEvent.click(menuLink('Component gallery'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Component gallery.');
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('aborts an active weather request when leaving and loads again on re-entry', async () => {
    const requests = [];
    const loader = vi.fn(options => new Promise(resolve => requests.push({ ...options, resolve })));
    open('/weather', loader);
    fireEvent.click(menuLink('Home'));
    expect(requests[0].signal.aborted).toBe(true);
    await act(() => requests[0].resolve(sample));
    expect(screen.queryByText(sample.requestId)).not.toBeInTheDocument();
    fireEvent.click(menuLink('Weather demo'));
    expect(loader).toHaveBeenCalledTimes(2);
    await act(() => requests[1].resolve(sample));
    expect(screen.getByText(sample.requestId)).toBeInTheDocument();
  });

  it('supports browser history and current-link changes', async () => {
    open('/', undefined, true);
    fireEvent.click(menuLink('Component gallery'));
    expect(menuLink('Component gallery')).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Small features.');
    fireEvent.click(screen.getByRole('button', { name: 'Browser forward' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Component gallery.');
  });

  it('closes the menu with Escape and restores focus to its button', () => {
    open('/components');
    const link = menuLink('Home');
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });

  it('shows gallery states using the shared widget without invoking the live loader', () => {
    const { loader } = open('/components');
    expect(screen.getByText('COMPONENT PREVIEW · SAMPLE DATA · NO NETWORK REQUESTS')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Weather widget preview' })).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByText('gallery-sample-only')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Loading', exact: true }));
    expect(screen.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: 'Weather widget preview' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Getting weather…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Error', exact: true }));
    expect(screen.getByRole('status')).toHaveTextContent('Sample error');
    expect(screen.getByRole('button', { name: 'Get weather' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Success', exact: true }));
    expect(screen.getByRole('status')).toHaveTextContent('Sample preview ready');
    expect(loader).not.toHaveBeenCalled();
  });

  it('simulates preview refresh locally and clears its timer on route exit', async () => {
    vi.useFakeTimers();
    const { loader } = open('/components');
    fireEvent.click(screen.getByRole('button', { name: 'Get weather' }));
    expect(screen.getByRole('button', { name: 'Getting weather…' })).toBeDisabled();
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByRole('status')).toHaveTextContent('Sample preview ready');
    fireEvent.click(screen.getByRole('button', { name: 'Get weather' }));
    expect(vi.getTimerCount()).toBe(1);
    const homeLink = menuLink('Home');
    await act(async () => { fireEvent.click(homeLink); });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Small features.');
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(vi.getTimerCount()).toBe(0);
    expect(loader).not.toHaveBeenCalled();
  });

  it('renders a useful not-found route', () => {
    const { loader } = open('/unknown');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found.');
    fireEvent.click(screen.getByRole('link', { name: 'Back to Home →' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Small features.');
    expect(loader).not.toHaveBeenCalled();
  });
});



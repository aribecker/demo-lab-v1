import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router';
import { expect, it, vi } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import App from '../App.jsx';
import Specifications from '../Specifications.jsx';
import { specifications } from '../specifications.js';

const original = '# Source\n\nR42 **Exact text** `code` #9ae6ef\n<script>alert(1)</script>\n';
const catalog = [
  { path: 'specs/requirements.md', read: () => Promise.resolve(original) },
  { path: 'specs/design-system.md', read: () => Promise.resolve('# Design\n') },
];
const open = (props = {}, query = '') => render(<MemoryRouter initialEntries={['/specifications' + query]}><Specifications catalog={catalog} {...props}/></MemoryRouter>);

it('discovers every specification recursively and preserves complete original text', async () => {
  const directory = resolve(process.cwd(), '../specs');
  async function walk(base, prefix = 'specs/') {
    const entries = await readdir(base, { withFileTypes: true });
    const paths = await Promise.all(entries.map(entry => entry.isDirectory() ? walk(join(base, entry.name), prefix + entry.name + '/') : entry.name.endsWith('.md') ? [prefix + entry.name] : []));
    return paths.flat().sort();
  }
  expect(specifications.map(file => file.path).sort()).toEqual(await walk(directory));
  for (const file of specifications) expect(await file.read()).toBe(await readFile(resolve(process.cwd(), '..', file.path), 'utf8'));
});

it('opens through Home and menu without backend calls', async () => {
  const loader = vi.fn(), command = vi.fn();
  render(<MemoryRouter><App loader={loader} simulationApi={{ read: vi.fn(), command }}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('link', { name: /Open Specifications/ }));
  expect(await screen.findByLabelText('Source of specs/requirements.md')).toHaveTextContent('R42');
  fireEvent.click(screen.getByRole('button', { name: 'Menu', exact: true }));
  expect(screen.getByRole('link', { name: 'Specifications', exact: true })).toHaveAttribute('aria-current', 'page');
  expect(loader).not.toHaveBeenCalled(); expect(command).not.toHaveBeenCalled();
});

it('safely highlights text, filters files, handles unknown selection and bounds font size', async () => {
  const { container } = open({}, '?file=../../secret');
  const source = await screen.findByLabelText('Source of specs/requirements.md');
  expect(screen.getByText('Unknown specification. Showing the default file.')).toBeInTheDocument();
  expect(source).toHaveTextContent('<script>alert(1)</script>');
  expect(container.querySelector('script')).toBeNull();
  expect(container.querySelector('.specifications__line--heading')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Filter files' }), { target: { value: 'absent' } });
  expect(screen.getByText(/No matching files/)).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Filter files' }), { target: { value: 'design' } });
  expect(screen.queryByRole('button', { name: 'specs/requirements.md' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'specs/design-system.md' }));
  expect(await screen.findByLabelText('Source of specs/design-system.md')).toHaveTextContent('# Design');
  const bigger = screen.getByRole('button', { name: 'Increase text size' }), smaller = screen.getByRole('button', { name: 'Decrease text size' });
  for (let i = 0; i < 8; i++) fireEvent.click(bigger);
  expect(bigger).toBeDisabled();
  for (let i = 0; i < 8; i++) fireEvent.click(smaller);
  expect(smaller).toBeDisabled();
});

it('keeps specification selection in browser history', async () => {
  function Back() { const navigate = useNavigate(); return <button onClick={() => navigate(-1)}>Back</button>; }
  render(<MemoryRouter initialEntries={['/specifications?file=specs/requirements.md']}><Specifications catalog={catalog}/><Back/></MemoryRouter>);
  await screen.findByLabelText('Source of specs/requirements.md');
  fireEvent.click(screen.getByRole('button', { name: 'specs/design-system.md' }));
  await screen.findByLabelText('Source of specs/design-system.md');
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByLabelText('Source of specs/requirements.md')).toBeInTheDocument();
});

it('ignores obsolete reads and retries failed specification loads', async () => {
  let finish;
  const slow = vi.fn(() => new Promise(resolve => { finish = resolve; }));
  const fast = vi.fn().mockRejectedValueOnce(new Error('private details')).mockResolvedValue('# Recovered');
  open({ catalog: [{ path: 'specs/requirements.md', read: slow }, { path: 'specs/other.md', read: fast }] });
  await waitFor(() => expect(slow).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'specs/other.md' }));
  expect(await screen.findByRole('alert')).not.toHaveTextContent('private details');
  fireEvent.click(screen.getByRole('button', { name: 'Retry specification' }));
  expect(await screen.findByLabelText('Source of specs/other.md')).toHaveTextContent('# Recovered');
  await act(async () => finish('# Obsolete'));
  expect(screen.queryByText('# Obsolete')).not.toBeInTheDocument();
});

it('copies and downloads original source and reports clipboard failure honestly', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
  const create = vi.fn(() => 'blob:specification');
  vi.stubGlobal('URL', class extends URL {}); URL.createObjectURL = create; URL.revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  try {
    open(); await screen.findByLabelText('Source of specs/requirements.md');
    fireEvent.click(screen.getByRole('button', { name: 'Copy source' }));
    await screen.findByText('Complete source copied.'); expect(writeText).toHaveBeenCalledWith(original);
    fireEvent.click(screen.getByRole('button', { name: 'Download .md' }));
    expect(create.mock.calls[0][0].size).toBe(new TextEncoder().encode(original).length);
    expect(click.mock.instances[0].download).toBe('requirements.md'); expect(click).toHaveBeenCalledOnce();
    writeText.mockRejectedValueOnce(new Error('denied'));
    fireEvent.click(screen.getByRole('button', { name: 'Copy source' }));
    expect(await screen.findByText(/Copy is unavailable/)).toBeInTheDocument();
  } finally { vi.unstubAllGlobals(); }
});

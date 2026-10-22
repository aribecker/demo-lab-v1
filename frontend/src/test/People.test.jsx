import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import People from '../People.jsx';
import { listPeople, addPerson } from '../peopleClient.js';
vi.mock('../peopleClient.js', () => ({ listPeople: vi.fn(), addPerson: vi.fn() }));
const ada = { id: 1, name: 'Ada Lovelace', createdAt: '2026-10-22T00:00:00Z' };
beforeEach(() => { listPeople.mockResolvedValue({ people: [], nextCursor: null }); addPerson.mockResolvedValue(ada); });
afterEach(() => vi.clearAllMocks());
it('loads, creates and displays a trimmed name from the server', async () => {
  render(<People />); await screen.findByText('No people yet. Add the first person.');
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Ada Lovelace  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add person' }));
  await screen.findByText('Ada Lovelace');
  expect(addPerson.mock.calls[0][0]).toBe('Ada Lovelace');
  expect(addPerson.mock.calls[0][1]).toMatch(/^[a-f0-9-]{36}$/);
  expect(screen.getByLabelText('Name')).toHaveValue('');
  expect(screen.getByRole('status')).toHaveTextContent('was added to PostgreSQL');
});
it('preserves draft and request ID after an uncertain failure', async () => {
  addPerson.mockRejectedValueOnce(new Error('Network error'));
  render(<People />); await screen.findByText('No people yet. Add the first person.');
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada Lovelace' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add person' }));
  await screen.findByRole('alert'); expect(screen.getByLabelText('Name')).toHaveValue('Ada Lovelace');
  fireEvent.click(screen.getByRole('button', { name: 'Add person' }));
  await screen.findByText('Ada Lovelace');
  expect(addPerson.mock.calls[0][1]).toBe(addPerson.mock.calls[1][1]);
});
it('paginates and refreshes without duplicating records', async () => {
  listPeople.mockResolvedValueOnce({ people: [{ ...ada, id: 2 }], nextCursor: 2 })
    .mockResolvedValueOnce({ people: [{ id: 1, name: 'Grace Hopper', createdAt: ada.createdAt }], nextCursor: null })
    .mockResolvedValue({ people: [ada], nextCursor: null });
  render(<People />); await screen.findByText('Ada Lovelace');
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  await screen.findByText('Grace Hopper'); expect(listPeople.mock.calls[1][0]).toBe(2);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh list' }));
  await waitFor(() => expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument());
});
it('reports configuration errors without showing a fake empty database', async () => {
  listPeople.mockRejectedValue(new Error('The PostgreSQL connection is pending configuration.'));
  render(<People />); expect(await screen.findByRole('alert')).toHaveTextContent('pending configuration');
  expect(screen.queryByText('No people yet. Add the first person.')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add person' })).toBeDisabled();
});

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Chatbot from '../Chatbot.jsx';
import { loadModels, sendChat } from '../chatClient.js';
vi.mock('../chatClient.js', () => ({ loadModels: vi.fn(), sendChat: vi.fn() }));
beforeEach(() => {
  loadModels.mockResolvedValue({ configured: true, models: [{ id: 'openrouter/free', name: 'Automático gratis' }, { id: 'test:free', name: 'Test gratis' }] });
  sendChat.mockResolvedValue({ reply: 'Hola Ariel', model: 'test:free' });
});
afterEach(() => { vi.clearAllMocks(); delete window.SpeechRecognition; delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; });
it('retries the model catalog after a backend startup failure', async () => {
  loadModels.mockRejectedValueOnce(new Error('Servidor iniciándose'));
  render(<Chatbot />);fireEvent.click(await screen.findByRole('button',{name:'Reintentar modelos'}));
  expect(await screen.findByRole('option',{name:'Test gratis'})).toBeInTheDocument();
  expect(sendChat).not.toHaveBeenCalled();
});
it('sends model and full history, renders plain text and resets on model change', async () => {
  render(<Chatbot />);
  await screen.findByRole('option', { name: 'Test gratis' });
  fireEvent.change(screen.getByLabelText('Tu mensaje'), { target: { value: 'Hola' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
  await screen.findByText('Hola Ariel');
  expect(sendChat.mock.calls[0][0]).toEqual({ model: 'openrouter/free', messages: [{ role: 'user', content: 'Hola' }] });
  fireEvent.change(screen.getByLabelText('Tu mensaje'), { target: { value: 'Seguimos' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
  await waitFor(() => expect(sendChat).toHaveBeenCalledTimes(2));
  expect(sendChat.mock.calls[1][0].messages).toHaveLength(3);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled());
  fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'test:free' } });
  expect(screen.queryByText('Hola Ariel')).not.toBeInTheDocument();
});
it('blocks sending without key and explains voice fallback', async () => {
  loadModels.mockResolvedValue({ configured: false, models: [] });
  render(<Chatbot />);
  await screen.findByText(/pendiente de activación/);
  expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  expect(screen.getByText(/Dictado no disponible/)).toBeInTheDocument();
});
it('preserves draft after provider error', async () => {
  sendChat.mockRejectedValue(new Error('Límite gratuito'));
  render(<Chatbot />); await screen.findByRole('option', { name: 'Test gratis' });
  fireEvent.change(screen.getByLabelText('Tu mensaje'), { target: { value: 'Hola' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Límite gratuito');
  expect(screen.getByLabelText('Tu mensaje')).toHaveValue('Hola');
});
it('dictates editable text, reads replies and cleans up voice', async () => {
  let engine;
  window.SpeechRecognition = class { constructor() { engine = this; } start = vi.fn(); abort = vi.fn(); stop = vi.fn(); };
  window.speechSynthesis = { cancel: vi.fn(), speak: vi.fn() };
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  const view = render(<Chatbot />); await screen.findByRole('option', { name: 'Test gratis' });
  fireEvent.click(screen.getByRole('button', { name: /Dictar/ }));
  act(() => { engine.onresult({ results: [[{ transcript: 'Hola por voz' }]] }); engine.onend(); });
  expect(screen.getByLabelText('Tu mensaje')).toHaveValue('Hola por voz');
  expect(sendChat).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText('Leer respuestas en voz alta'));
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
  await screen.findByText('Hola Ariel');
  expect(window.speechSynthesis.speak).toHaveBeenCalled();
  view.unmount(); expect(engine.abort).toHaveBeenCalled(); expect(window.speechSynthesis.cancel).toHaveBeenCalled();
});


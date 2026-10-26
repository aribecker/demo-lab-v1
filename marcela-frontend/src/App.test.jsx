import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App.jsx';

function openForm() {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Dejar consulta' }));
  return document.getElementById('form');
}

describe('Marcela platform acceptance criteria', () => {
  it('R1: switches views, identifies current page and focuses the form heading', () => {
    openForm();
    const heading = screen.getByRole('heading', { name: 'Dejá tu consulta' });
    expect(heading).toBeVisible();
    expect(heading).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Dejar consulta' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }));
    expect(screen.getByRole('heading', { name: 'Respuestas profesionales para tus consultas contables.' })).toBeVisible();
    expect(heading).not.toBeVisible();
  });
  it.each([['Solicitar consulta', 'Abono semanal'], ['Pedir presupuesto', 'Presupuesto de trabajo']])('R2: %s selects the correct service', (button, value) => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: button }));
    expect(screen.getByLabelText('Tipo de solicitud *')).toHaveValue(value);
  });
  it('R3: rejects incomplete/invalid forms and requires explicit consent', () => {
    const form = openForm();
    expect(form.checkValidity()).toBe(false);
    fireEvent.change(screen.getByLabelText('Nombre y apellido *'), { target: { value: 'Persona de prueba' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico *'), { target: { value: 'incorrecto' } });
    expect(screen.getByLabelText('Correo electrónico *').validity.typeMismatch).toBe(true);
    fireEvent.change(screen.getByLabelText('Correo electrónico *'), { target: { value: 'prueba@example.com' } });
    fireEvent.change(screen.getByLabelText('Área de consulta *'), { target: { value: 'Pericias contables' } });
    fireEvent.change(screen.getByLabelText('Tipo de solicitud *'), { target: { value: 'Abono semanal' } });
    fireEvent.change(screen.getByLabelText('Asunto *'), { target: { value: 'Consulta de prueba' } });
    fireEvent.change(screen.getByLabelText('Detalle de la consulta *'), { target: { value: 'Descripción suficiente de una consulta de prueba.' } });
    expect(form.checkValidity()).toBe(false);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(form.checkValidity()).toBe(true);
    expect(screen.getByLabelText('Detalle de la consulta *')).toHaveAttribute('minlength', '20');
    expect(screen.getByLabelText('Detalle de la consulta *')).toHaveAttribute('maxlength', '5000');
  });
  it('R3: retains entered details when navigating away and back', () => {
    openForm();
    fireEvent.change(screen.getByLabelText('Nombre y apellido *'), { target: { value: 'Mi nombre' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dejar consulta' }));
    expect(screen.getByLabelText('Nombre y apellido *')).toHaveValue('Mi nombre');
  });
  it('R4: preserves native external POST, activation flow, honeypot and consent payload without sending', () => {
    const form = openForm();
    expect(form).toHaveAttribute('action', 'https://formsubmit.co/conta.conmigo.1234@gmail.com');
    expect(form).toHaveAttribute('method', 'POST');
    expect(form.querySelector('[name="_honey"]')).toHaveAttribute('tabindex', '-1');
    expect(form.querySelector('[name="_template"]')).toHaveValue('table');
    expect(form.querySelector('[name="_captcha"]')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(new FormData(form).get('consentimiento')).toBe('Aceptado');
  });
  it('R5/R6: shows provider activation information, terms and native FAQs', () => {
    render(<App />);
    expect(screen.getByText('ARS / semana')).toBeVisible();
    const question = screen.getByText('¿Un trabajo completo está incluido en el abono?');
    expect(question.tagName).toBe('SUMMARY');
    expect(question.parentElement.tagName).toBe('DETAILS');
    expect(screen.getByRole('contentinfo')).toHaveTextContent(`© ${new Date().getFullYear()} Marcela Schpilberg`);
    fireEvent.click(screen.getByRole('button', { name: 'Dejar consulta' }));
    expect(screen.getByText(/El destinatario debe activar FormSubmit/)).toBeVisible();
  });
});

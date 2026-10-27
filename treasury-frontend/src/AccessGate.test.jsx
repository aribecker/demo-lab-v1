import React from 'react';
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {AccessGate} from './AccessGate.jsx';
import * as auth from './authClient.js';
vi.mock('./authClient.js',()=>({initialize:vi.fn(),providers:vi.fn(),startLogin:vi.fn(),logout:vi.fn()}));
beforeEach(()=>{vi.clearAllMocks();auth.providers.mockResolvedValue([{id:'google',name:'Google',enabled:true}]);});
afterEach(cleanup);
describe('acceso autenticado',()=>{
 it('oculta los datos hasta autenticar y permite iniciar OAuth',async()=>{
  auth.initialize.mockResolvedValue(null);render(<AccessGate><h1>Datos privados</h1></AccessGate>);
  fireEvent.click(await screen.findByText('Continuar con Google'));expect(auth.startLogin).toHaveBeenCalledWith('google');
  expect(screen.queryByText('Datos privados')).not.toBeInTheDocument();
 });
 it('restaura la sesión y cierra el acceso al vencer',async()=>{
  auth.initialize.mockResolvedValue({profile:{name:'Ariel'}});render(<AccessGate><h1>Datos privados</h1></AccessGate>);
  expect(await screen.findByText('Datos privados')).toBeInTheDocument();
  window.dispatchEvent(new Event('treasury:session-expired'));
  await waitFor(()=>expect(screen.queryByText('Datos privados')).not.toBeInTheDocument());
  expect(screen.getByRole('alert')).toHaveTextContent('La sesión venció');
 });
 it('revoca la sesión antes de cerrar',async()=>{
  auth.initialize.mockResolvedValue({profile:{name:'Ariel'}});auth.logout.mockResolvedValue(null);
  render(<AccessGate><h1>Datos privados</h1></AccessGate>);
  fireEvent.click(await screen.findByText('Cerrar sesión'));
  await waitFor(()=>expect(auth.logout).toHaveBeenCalledOnce());
  await waitFor(()=>expect(screen.queryByText('Datos privados')).not.toBeInTheDocument());
 });
});

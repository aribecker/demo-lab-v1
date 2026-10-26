import React from 'react';
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {Backup} from './Backup.jsx';
import * as api from './api.js';
vi.mock('./api.js',()=>({request:vi.fn()}));
const preview={confirmation:'server-token',recipient:'aribecker2@gmail.com',date:'20261026',files:['Treasury Database-20261026.zip','Treasury Database-20261026.xlsx'],configured:true};
beforeEach(()=>{api.request.mockReset();});afterEach(cleanup);
describe('Confirmación de respaldo',()=>{
 it('muestra destinatario y ambos archivos sin generar ni enviar hasta confirmar; evita doble clic',async()=>{
  let done;api.request.mockImplementation(path=>path.endsWith('preview')?Promise.resolve(preview):new Promise(r=>{done=r;}));render(<Backup/>);
  await screen.findByText('Por favor, confirmá');expect(screen.getByText(preview.recipient)).toBeInTheDocument();preview.files.forEach(f=>expect(screen.getByText(f)).toBeInTheDocument());
  expect(api.request).toHaveBeenCalledTimes(1);expect(screen.getByRole('link',{name:'Cancelar'})).toHaveAttribute('href','/');
  fireEvent.click(screen.getByRole('button',{name:'Confirmar y enviar'}));fireEvent.click(screen.getByRole('button',{name:'Generando y enviando…'}));expect(api.request).toHaveBeenCalledTimes(2);
  expect(api.request).toHaveBeenLastCalledWith('/api/treasury/backup/send',{body:{confirmation:'server-token'}});
  done({...preview,message_id:'provider-id'});await screen.findByText('Correo aceptado para envío');
 });
 it('bloquea el envío cuando falta configuración de servidor',async()=>{
  api.request.mockResolvedValue({...preview,configured:false});render(<Backup/>);await screen.findByText('Por favor, confirmá');expect(screen.getByRole('button',{name:'Confirmar y enviar'})).toBeDisabled();expect(screen.getByRole('alert')).toHaveTextContent('pendiente de configuración');expect(api.request).toHaveBeenCalledTimes(1);
 });
 it('muestra fallo real sin éxito y reintenta con el mismo token de confirmación',async()=>{
  api.request.mockResolvedValueOnce(preview).mockRejectedValueOnce(new Error('No se aceptó el correo')).mockResolvedValueOnce({...preview,message_id:'retry-id'});
  render(<Backup/>);fireEvent.click(await screen.findByRole('button',{name:'Confirmar y enviar'}));expect(await screen.findByRole('alert')).toHaveTextContent('No se aceptó el correo');expect(screen.queryByText('Correo aceptado para envío')).not.toBeInTheDocument();
  await waitFor(()=>expect(screen.getByRole('button',{name:'Confirmar y enviar'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Confirmar y enviar'}));await screen.findByText('Correo aceptado para envío');expect(api.request.mock.calls[1][1]).toEqual(api.request.mock.calls[2][1]);
 });
});

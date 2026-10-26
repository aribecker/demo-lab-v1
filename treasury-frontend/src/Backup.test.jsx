import React from 'react';
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {Backup} from './Backup.jsx';
import * as api from './api.js';
vi.mock('./api.js',()=>({request:vi.fn(),download:vi.fn(),API:'https://api.example'}));
const preview={confirmation:'server-token',recipient:'aribecker2@gmail.com',date:'20261026',files:['Treasury Database-20261026.zip','Treasury Database-20261026.xlsx'],configured:false};
const prepared={...preview,mail_accepted:false,downloads:['/files/zip','/files/xlsx']};
beforeEach(()=>{api.request.mockReset();api.download.mockReset();});afterEach(cleanup);
describe('Descargas independientes del correo',()=>{
 it('confirma antes de generar y descarga ambos archivos aunque el correo no esté configurado',async()=>{
  api.request.mockImplementation(path=>Promise.resolve(path.endsWith('preview')?preview:path.endsWith('prepare')?prepared:new Blob(['backup'])));
  render(<Backup/>);const button=await screen.findByRole('button',{name:'Confirmar y descargar'});expect(button).toBeEnabled();expect(api.download).not.toHaveBeenCalled();fireEvent.click(button);
  await waitFor(()=>expect(api.download).toHaveBeenCalledTimes(2));expect(screen.getByRole('status')).toHaveTextContent('No se pudo asegurar el envío del correo');expect(api.download.mock.calls.map(c=>c[1])).toEqual(preview.files);expect(screen.getByRole('link',{name:preview.files[0]})).toHaveAttribute('href','https://api.example/files/zip');
 });
 it('no inicia descargas parciales si falla obtener un archivo y permite reintentar',async()=>{
  api.request.mockImplementation(path=>path.endsWith('preview')?Promise.resolve(preview):path.endsWith('prepare')?Promise.resolve(prepared):Promise.reject(new Error('Falló descarga')));
  render(<Backup/>);fireEvent.click(await screen.findByRole('button',{name:'Confirmar y descargar'}));await screen.findByText('Falló descarga');expect(api.download).not.toHaveBeenCalled();expect(screen.queryByText('Respaldo listo')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Confirmar y descargar'})).toBeEnabled();
 });
 it('descarga también cuando el proveedor acepta el correo y evita doble clic',async()=>{
  let finish;api.request.mockImplementation(path=>path.endsWith('preview')?Promise.resolve({...preview,configured:true}):path.endsWith('prepare')?new Promise(r=>{finish=r;}):Promise.resolve(new Blob(['backup'])));
  render(<Backup/>);fireEvent.click(await screen.findByRole('button',{name:'Confirmar y descargar'}));fireEvent.click(screen.getByRole('button',{name:'Generando respaldo…'}));expect(api.request).toHaveBeenCalledTimes(2);finish({...prepared,mail_accepted:true});await waitFor(()=>expect(api.download).toHaveBeenCalledTimes(2));expect(screen.getByRole('status')).toHaveTextContent('aceptó el respaldo');
 });
});

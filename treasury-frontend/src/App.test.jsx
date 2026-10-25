import React from 'react';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,act} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {MemoryRouter} from 'react-router';
vi.mock('./api.js',()=>({restore:vi.fn(),request:vi.fn(),login:vi.fn(),logout:vi.fn(),root:id=>`/api/treasury/institutions/${id}`,download:vi.fn()}));
import * as api from './api.js';
import {App} from './main.jsx';
const inst={id:'m',name:'Mariners',code:'MAR',theme_id:'mariners',active:true};
const accounts=[{id:'cash',code:'1',name:'Caja pesos',active:true,allows_posting:true,type:'ASSET',currency_policy:'ARS'},{id:'income',code:'4',name:'Cuotas',active:true,allows_posting:true,type:'INCOME',currency_policy:'BOTH'}];
const owner={canUseSimulator:true,profile:{name:'Ariel Becker'}};
function mount(route){return render(<MemoryRouter initialEntries={[route]}><App/></MemoryRouter>);}
beforeEach(()=>{vi.stubEnv("VITE_TREASURY_PENDING","false");vi.clearAllMocks();localStorage.clear();api.restore.mockResolvedValue(owner);api.request.mockImplementation(async path=>{if(path.endsWith('/institutions'))return [inst];if(path.endsWith('/themes'))return [{id:'mariners',name:'Mariners'},{id:'scottish',name:'Verde escocés'},{id:'generic',name:'Clásico'}];if(path.endsWith('/accounts'))return accounts;if(path.endsWith('/members'))return [];if(path.endsWith('/entries'))return [];throw new Error('Unexpected '+path);});});
afterEach(cleanup);
describe('Flujos de tesorería',()=>{
 it('abre la tesorería sin iniciar ni restaurar una sesión',async()=>{api.restore.mockResolvedValue(null);mount('/');await screen.findByRole('heading',{name:'Elegí una institución',level:1});expect(api.restore).not.toHaveBeenCalled();expect(api.login).not.toHaveBeenCalled();expect(api.request).toHaveBeenCalledWith('/api/treasury/institutions');expect(screen.queryByRole('button',{name:/Continuar con Google/})).not.toBeInTheDocument();});
 it('el menú sándwich abre las seis opciones y se cierra al navegar',async()=>{mount('/');const toggle=screen.getByRole('button',{name:'Abrir menú'});expect(toggle).toHaveAttribute('aria-expanded','false');fireEvent.click(toggle);for(const name of ['Instituciones','Miembros','Plan de cuentas','Libro de asientos','Balance','Libro diario'])expect(screen.getByRole('link',{name})).toBeInTheDocument();fireEvent.click(screen.getByRole('link',{name:'Instituciones'}));expect(await screen.findByRole('heading',{level:1,name:'Instituciones'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'Abrir menú'})).toHaveAttribute('aria-expanded','false');});
 it('Escape cierra el menú sándwich',()=>{mount('/');fireEvent.click(screen.getByRole('button',{name:'Abrir menú'}));expect(screen.getByRole('button',{name:'Cerrar menú principal'})).toHaveAttribute('aria-expanded','true');fireEvent.keyDown(window,{key:'Escape'});expect(screen.getByRole('button',{name:'Abrir menú'})).toHaveAttribute('aria-expanded','false');});
 it('seleccionar institución cambia su skin y habilita las vistas',async()=>{mount('/');await screen.findByRole('heading',{name:'Elegí una institución',level:1});fireEvent.click(await screen.findByRole('button',{name:'Seleccionar Mariners'}));expect(await screen.findByRole('heading',{name:'Mariners',level:1})).toBeInTheDocument();expect(document.querySelector('.app')).toHaveAttribute('data-theme','mariners');});
 it('solo habilita contabilizar cuando ARS y USD balancean',async()=>{localStorage.setItem('treasury.institution','m');mount('/entry');await screen.findByRole('heading',{name:'Nuevo asiento'});await waitFor(()=>expect(screen.getByLabelText('Cuenta línea 1').options).toHaveLength(3));const post=screen.getByRole('button',{name:'Contabilizar asiento'});expect(post).toBeDisabled();fireEvent.change(screen.getByLabelText('Cuenta línea 1'),{target:{value:'cash'}});fireEvent.change(screen.getByLabelText('Cuenta línea 2'),{target:{value:'income'}});fireEvent.change(screen.getByLabelText('Debe línea 1'),{target:{value:'123,45'}});fireEvent.change(screen.getByLabelText('Haber línea 2'),{target:{value:'123,45'}});expect(post).toBeEnabled();fireEvent.change(screen.getByLabelText('Moneda línea 2'),{target:{value:'USD'}});expect(post).toBeDisabled();});
 it('carga campos de miembro y envía la institución seleccionada',async()=>{localStorage.setItem('treasury.institution','m');mount('/members');await screen.findByRole('heading',{name:'Miembros'});fireEvent.click(screen.getByRole('button',{name:'Agregar miembro'}));fireEvent.change(screen.getByLabelText('Nombre *'),{target:{value:'Ariel'}});fireEvent.change(screen.getByLabelText('Apellido *'),{target:{value:'Becker'}});fireEvent.change(screen.getByLabelText('Residencia'),{target:{value:'CABA'}});fireEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));await waitFor(()=>expect(api.request).toHaveBeenCalledWith('/api/treasury/institutions/m/members',{body:expect.objectContaining({first_name:'Ariel',last_name:'Becker',residence:'CABA'})}));});
 it('restaura la selección guardada sin mostrar el selector durante una carga lenta',async()=>{
  const fallback=api.request.getMockImplementation();let release;
  localStorage.setItem('treasury.institution','m');
  api.request.mockImplementation(path=>path.endsWith('/institutions')?new Promise(resolve=>{release=resolve;}):fallback(path));
  mount('/members');expect(screen.getByRole('status')).toHaveTextContent('Cargando instituciones');expect(screen.queryByRole('heading',{name:'Elegí una institución'})).not.toBeInTheDocument();
  await act(async()=>release([inst]));await screen.findByRole('heading',{name:'Miembros',level:1});expect(screen.getByLabelText('Institución activa')).toHaveValue('m');expect(document.querySelector('.app')).toHaveAttribute('data-theme','mariners');
  cleanup();api.request.mockImplementation(fallback);mount('/accounts');await screen.findByRole('heading',{name:'Plan de cuentas',level:1});expect(screen.getByLabelText('Institución activa')).toHaveValue('m');
 });
 it('conserva el contexto y el tema durante el guardado y la actualización del catálogo',async()=>{
  const fallback=api.request.getMockImplementation();let release,calls=0;
  localStorage.setItem('treasury.institution','m');
  api.request.mockImplementation((path,opts)=>{if(path.endsWith('/institutions')){calls++;return calls===2?new Promise(resolve=>{release=resolve;}):Promise.resolve([inst]);}if(opts?.body&&path.endsWith('/members'))return Promise.resolve({id:'member'});return fallback(path,opts);});
  mount('/members');await screen.findByRole('heading',{name:'Miembros',level:1});fireEvent.click(screen.getByRole('button',{name:'Agregar miembro'}));fireEvent.change(screen.getByLabelText('Nombre *'),{target:{value:'Ariel'}});fireEvent.change(screen.getByLabelText('Apellido *'),{target:{value:'Becker'}});fireEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
  await waitFor(()=>expect(release).toBeTypeOf('function'));expect(screen.getByRole('heading',{name:'Miembros',level:1})).toBeInTheDocument();expect(screen.queryByRole('heading',{name:'Elegí una institución'})).not.toBeInTheDocument();expect(screen.getByLabelText('Institución activa')).toHaveValue('m');expect(document.querySelector('.app')).toHaveAttribute('data-theme','mariners');
  await act(async()=>release([inst]));await waitFor(()=>expect(screen.queryByLabelText('Nombre *')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button',{name:'Abrir menú'}));fireEvent.click(screen.getByRole('link',{name:'Plan de cuentas'}));await screen.findByRole('heading',{name:'Plan de cuentas',level:1});fireEvent.click(screen.getByRole('button',{name:'Abrir menú'}));fireEvent.click(screen.getByRole('link',{name:'Miembros'}));await screen.findByRole('heading',{name:'Miembros',level:1});expect(screen.getByLabelText('Institución activa')).toHaveValue('m');
 });
 it('cambiar de institución usa el nuevo tema y envía miembros al ID correcto',async()=>{
  const fallback=api.request.getMockImplementation(),other={...inst,id:'k',name:'Marca',code:'MARCA',theme_id:'scottish'};
  localStorage.setItem('treasury.institution','m');api.request.mockImplementation((path,opts)=>path.endsWith('/institutions')?Promise.resolve([inst,other]):fallback(path,opts));mount('/members');await screen.findByRole('heading',{name:'Miembros',level:1});
  fireEvent.change(screen.getByLabelText('Institución activa'),{target:{value:'k'}});await waitFor(()=>expect(api.request).toHaveBeenCalledWith('/api/treasury/institutions/k/members'));expect(document.querySelector('.app')).toHaveAttribute('data-theme','scottish');fireEvent.click(screen.getByRole('button',{name:'Agregar miembro'}));expect(screen.getByText('Registrando en').parentElement).toHaveTextContent('Marca');
  fireEvent.change(screen.getByLabelText('Nombre *'),{target:{value:'Ana'}});fireEvent.change(screen.getByLabelText('Apellido *'),{target:{value:'Pérez'}});fireEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));await waitFor(()=>expect(api.request).toHaveBeenCalledWith('/api/treasury/institutions/k/members',{body:expect.objectContaining({first_name:'Ana'})}));
 });
 it('crear una institución la selecciona automáticamente después de actualizar el catálogo',async()=>{
  const fallback=api.request.getMockImplementation();let created=false;const added={...inst,id:'new',name:'Nueva logia',code:'NUE',theme_id:'scottish'};
  api.request.mockImplementation((path,opts)=>{if(path.endsWith('/institutions')){if(opts?.body){created=true;return Promise.resolve({id:added.id});}return Promise.resolve(created?[inst,added]:[inst]);}return fallback(path,opts);});
  mount('/institutions');await waitFor(()=>expect(screen.getByLabelText('Institución activa').options).toHaveLength(2));fireEvent.click(screen.getByRole('button',{name:'Agregar institución'}));fireEvent.change(screen.getByLabelText('Nombre *'),{target:{value:added.name}});fireEvent.change(screen.getByLabelText('Código *'),{target:{value:added.code}});fireEvent.change(screen.getByLabelText('Diseño'),{target:{value:'scottish'}});fireEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
  await screen.findByRole('heading',{name:added.name,level:1});expect(localStorage.getItem('treasury.institution')).toBe('new');expect(document.querySelector('.app')).toHaveAttribute('data-theme','scottish');fireEvent.click(screen.getByRole('link',{name:/Miembros/}));await screen.findByRole('heading',{name:'Miembros',level:1});expect(api.request).toHaveBeenCalledWith('/api/treasury/institutions/new/members');
 });
 it('un ID guardado inexistente obliga a elegir sin usar otra institución silenciosamente',async()=>{
  localStorage.setItem('treasury.institution','missing');mount('/members');await screen.findByRole('heading',{name:'Elegí una institución',level:1});await waitFor(()=>expect(localStorage.getItem('treasury.institution')).toBeNull());expect(api.request).not.toHaveBeenCalledWith('/api/treasury/institutions/m/members');
 });
 it('Cambiar institución vuelve al primer paso y permite elegir otra',async()=>{
  localStorage.setItem('treasury.institution','m');mount('/members');await screen.findByRole('heading',{name:'Miembros',level:1});fireEvent.click(screen.getByRole('button',{name:'Cambiar institución'}));await screen.findByRole('heading',{name:'Elegí una institución',level:1});expect(localStorage.getItem('treasury.institution')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Seleccionar Mariners'}));await screen.findByRole('heading',{name:'Mariners',level:1});
 });

});

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';
import Database from '../Database.jsx';
import App from '../App.jsx';
import * as api from '../databaseClient.js';

const catalog={database:'demo_db',schemas:[{name:'public',tables:[{name:'people'}]},{name:'bitcoin_shared',tables:[{name:'simulation_state'}]}]};
const columns=[{name:'id',type:'bigint',primaryKey:true},{name:'name',type:'text',primaryKey:false},{name:'note',type:'text',primaryKey:false},{name:'empty',type:'text',primaryKey:false}];
const row=(position,name='Ada')=>({position,label:`id=${position+1} · name=${name}`,cells:[{value:String(position+1),truncated:false},{value:name,truncated:false},{value:null,truncated:false},{value:'',truncated:false}]});
const page={schema:'public',table:'people',columns,rows:[row(0)],ordering:'id ASC',offset:0,nextOffset:null};

it('groups schemas, lazily loads a table and expands each column of a selected row',async()=>{
  vi.spyOn(api,'loadDatabase').mockResolvedValue(catalog);
  const rows=vi.spyOn(api,'loadTable').mockResolvedValue(page);
  render(<Database/>);
  expect(await screen.findByText('demo_db')).toBeInTheDocument();
  expect(screen.getByRole('region',{name:'Schema bitcoin_shared'})).toBeInTheDocument();
  expect(rows).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Expand table public.people'}));
  expect(await screen.findByText('id=1 · name=Ada')).toBeInTheDocument();
  expect(rows).toHaveBeenCalledWith('public','people',0,expect.any(AbortSignal));
  expect(screen.queryByRole('definition')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Expand row 1 in public.people'}));
  expect(screen.getByText('bigint · primary key')).toBeInTheDocument();
  expect(screen.getByText('NULL')).toBeInTheDocument();expect(screen.getByText('(empty string)')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Collapse table public.people'}));
  expect(screen.queryByText('id=1 · name=Ada')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Expand table public.people'}));
  expect(rows).toHaveBeenCalledTimes(1);
});

it('paginates, refreshes and renders stored markup as text',async()=>{
  vi.spyOn(api,'loadDatabase').mockResolvedValue(catalog);
  vi.spyOn(api,'loadTable').mockResolvedValueOnce({...page,nextOffset:1}).mockResolvedValueOnce({...page,offset:1,rows:[row(1,'<img src=x onerror=alert(1)>')]}).mockResolvedValueOnce({...page,rows:[]});
  const {container}=render(<Database/>);
  fireEvent.click(await screen.findByRole('button',{name:'Expand table public.people'}));
  fireEvent.click(await screen.findByRole('button',{name:'Load more rows'}));
  expect(await screen.findByText('id=2 · name=<img src=x onerror=alert(1)>')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Expand row 2 in public.people'}));
  expect(container.querySelector('img')).toBeNull();
  expect(api.loadTable).toHaveBeenNthCalledWith(2,'public','people',1,expect.any(AbortSignal));
  fireEvent.click(screen.getByRole('button',{name:'Refresh rows'}));
  expect(await screen.findByText('This table has no rows.')).toBeInTheDocument();
});

it('retries catalog and row errors without creating replacement data',async()=>{
  vi.spyOn(api,'loadDatabase').mockRejectedValueOnce(new Error('Database offline')).mockResolvedValue(catalog);
  vi.spyOn(api,'loadTable').mockRejectedValueOnce(new Error('Read failed')).mockResolvedValue(page);
  render(<Database/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Database offline');
  fireEvent.click(screen.getByRole('button',{name:'Retry database'}));
  fireEvent.click(await screen.findByRole('button',{name:'Expand table public.people'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Read failed');
  fireEvent.click(screen.getByRole('button',{name:'Retry rows'}));
  expect(await screen.findByText('id=1 · name=Ada')).toBeInTheDocument();
});

it('shows explicit truncation and loads no rows for an empty catalog',async()=>{
  vi.spyOn(api,'loadDatabase').mockResolvedValue(catalog);
  vi.spyOn(api,'loadTable').mockResolvedValue({...page,rows:[{...row(0),cells:row(0).cells.map((cell,index)=>index===1?{value:'long value',truncated:true}:cell)}]});
  render(<Database/>);
  fireEvent.click(await screen.findByRole('button',{name:'Expand table public.people'}));
  fireEvent.click(await screen.findByRole('button',{name:'Expand row 1 in public.people'}));
  expect(screen.getByText('Value truncated to 65,536 characters.')).toBeInTheDocument();
});

it('opens directly at /database and exposes the menu and Home destination',async()=>{
  vi.spyOn(api,'loadDatabase').mockResolvedValue({database:'demo_db',schemas:[]});
  const rows=vi.spyOn(api,'loadTable');
  render(<MemoryRouter initialEntries={['/database']}><App/></MemoryRouter>);
  expect(await screen.findByText('No accessible tables were found.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Menu',exact:true}));
  expect(screen.getByRole('link',{name:'Database',exact:true})).toHaveAttribute('aria-current','page');
  fireEvent.click(screen.getByRole('link',{name:'Home',exact:true}));
  expect(screen.getByRole('link',{name:/Database Browse PostgreSQL/})).toHaveAttribute('href','/database');
  expect(rows).not.toHaveBeenCalled();
});

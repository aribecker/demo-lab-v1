import {describe,it,expect} from 'vitest';
import {cents,decimal,totals,balanceHtml,journalHtml} from './reports.js';
const institution={name:'Mariners <script>alert(1)</script>',code:'M"1'};
const line=(currency,debit,credit)=>({account_id:'a',currency,debit,credit});
describe('Contabilidad y exportación autónoma',()=>{
 it('usa centavos exactos y exige balance por moneda',()=>{
  expect(cents('0.10')+cents('0.20')).toBe(30n);expect(cents('0.001')).toBeNull();expect(cents('-1')).toBeNull();
  expect(totals([line('ARS','100','0'),line('USD','0','100')]).balanced).toBe(false);
  expect(totals([line('ARS','0.10','0'),line('ARS','0.20','0'),line('ARS','0','0.30'),line('USD','5','0'),line('USD','0','5')]).balanced).toBe(true);
  expect(decimal(-105n)).toBe('-1.05');expect(cents('9999999999999999.99')).toBe(999999999999999999n);
 });
 it('presenta los dos saldos y escapa datos del balance',()=>{
  const html=balanceHtml({institution,cutoff:'2026-10-25',rows:[{id:'a',code:'1',name:'Caja <img onerror=x>',type:'ASSET',currency:'ARS',debit:'10.30',credit:'0.00',net:'10.30'},{id:'a',code:'1',name:'Caja',type:'ASSET',currency:'USD',debit:'5.00',credit:'0.00',net:'5.00'}]});
  expect(html).toContain('10,30');expect(html).toContain('5,00');expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');expect(html).not.toContain('<img onerror');expect(html).toContain('Content-Security-Policy');
 });
 it('incrusta imágenes y PDF sin dependencias externas',()=>{
  const html=journalHtml({institution,from:'2026-10-01',to:'2026-10-25',entries:[{entry_number:1,entry_date:'2026-10-25',description:'<script>x</script>',reference:'" onmouseover="x',lines:[{...line('USD','10','0'),account_code:'1',account_name:'Caja',first_name:'Ariel',last_name:'Becker'}],attachments:[{id:'p',file_name:'foto.png',content_type:'image/png'},{id:'d',file_name:'factura.pdf',content_type:'application/pdf'}]}]}, {p:'data:image/png;base64,aGVsbG8=',d:'data:application/pdf;base64,aGVsbG8='});
  expect(html).toContain('src="data:image/png;base64,');expect(html).toContain('href="data:application/pdf;base64,');expect(html).toContain('download="factura.pdf"');expect(html).not.toMatch(/(?:src|href)="https?:/);expect(html).not.toContain('<script>');
 });
 it('no exporta un diario incompleto si falta un comprobante',()=>{
  expect(()=>journalHtml({institution,from:'x',to:'y',entries:[{entry_number:1,entry_date:'x',lines:[],attachments:[{id:'missing',file_name:'x',content_type:'image/png'}]}]})).toThrow('Falta un comprobante');
 });
});

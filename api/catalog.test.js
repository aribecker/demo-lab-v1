import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalog,validateRequest} from './catalog.js';
const valid={name:'Nombre Prueba',email:'test@example.com',objective:'CONSULTAS',area:'Contabilidad',description:'Necesito orientación sobre un procedimiento contable.',consent:true};
test('acepta campos opcionales vacíos y texto libre',()=>assert.equal(validateRequest(valid,catalog).phone,''));
test('rechaza área incompatible',()=>assert.throws(()=>validateRequest({...valid,objective:'CLASES',area:'Estados contables'},catalog)));
test('requiere consentimiento y email válido',()=>{for(const patch of [{consent:false},{email:'inválido'},{description:'corto'},{name:''}])assert.throws(()=>validateRequest({...valid,...patch},catalog));});
test('valida tipo de necesidad según área',()=>{assert.throws(()=>validateRequest({...valid,need:'ARCA'},catalog));assert.equal(validateRequest({...valid,area:'Trámites',need:'ARCA'},catalog).need,'ARCA');});
test('rechaza tipos y excesos de texto',()=>{assert.throws(()=>validateRequest({...valid,phone:{}},catalog));assert.throws(()=>validateRequest({...valid,description:'x'.repeat(5001)},catalog));});

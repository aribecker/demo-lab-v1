const other = 'No estoy seguro / Otro';
export const catalog = [
 {id:'CONSULTAS',label:'Consultas y asesoramiento profesional',areas:['Contabilidad','Impuestos','Auditoría','Pericias','Trámites',other],needs:['Duda puntual','Asesoramiento sobre un procedimiento','Análisis de una situación particular',other]},
 {id:'CLASES',label:'Clases y apoyo académico',areas:['Contabilidad','Auditoría','Impuestos','Pericias','Otras materias',other],needs:['Consulta académica puntual','Clase individual','Preparación de examen','Acompañamiento académico',other]},
 {id:'TRABAJOS',label:'Solicitud de trabajos profesionales',areas:['Estados contables','Auditoría','Impuestos','Pericias','Trámites',other],needs:['Confección de estados contables','Auditoría','Liquidaciones impositivas','Pericias contables','Otro trabajo profesional',other]}
];
export const procedures = ['ARCA','IGJ','Inscripciones profesionales','Presentaciones y gestiones administrativas',other];
export function validateRequest(input, categories) {
 const result = {};
 for (const [key,max] of Object.entries({name:120,email:200,description:5000,phone:60,availability:500,extra:2000,need:180,area:180,objective:30})) {
  if (input[key] != null && typeof input[key] !== 'string') throw new Error('Formato inválido');
  result[key] = (input[key] || '').trim();
  if(result[key].length > max) throw new Error('El texto excede el límite permitido');
 }
 const category=categories.find(c=>c.id===result.objective);
 if (!result.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email) || result.description.length<20 || input.consent!==true) throw new Error('Completá los campos obligatorios y el consentimiento');
 if(!category || !category.areas.includes(result.area)) throw new Error('Seleccioná un objetivo y área válidos');
 const needs=result.area==='Trámites'?procedures:category.needs;
 if(result.need && !needs.includes(result.need)) throw new Error('Seleccioná un tipo de necesidad válido');
 return result;
}

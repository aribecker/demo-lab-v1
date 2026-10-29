import express from 'express';
import pg from 'pg';
import {randomUUID, timingSafeEqual, createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {catalog,procedures,validateRequest} from './catalog.js';
const app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'20kb'}));
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:3});
app.use((req,res,next)=>{res.set('Cache-Control','no-store');const origin=req.get('origin');if(origin && origin!==process.env.FRONTEND_ORIGIN)return res.status(403).json({message:'Origen no autorizado'}); if(origin)res.set('Access-Control-Allow-Origin',origin);res.set('Access-Control-Allow-Headers','Content-Type, Authorization, Idempotency-Key');res.set('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS');if(req.method==='OPTIONS')return res.sendStatus(204);next();});
app.get('/health',async(req,res)=>{await pool.query('SELECT 1');res.json({status:'ok'});});
const categories=async()=> (await pool.query('SELECT definition FROM marcela.consultation_categories ORDER BY id')).rows.map(r=>r.definition);
app.get('/api/catalog',async(req,res)=>res.json({categories:await categories(),procedures}));
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
async function transaction(fn){const c=await pool.connect();try{await c.query('BEGIN');const r=await fn(c);await c.query('COMMIT');return r;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
app.post('/api/requests',async(req,res)=>{
 let payload;try{payload=validateRequest(req.body,await categories());}catch(e){return res.status(422).json({message:e.message});}
 const key=req.get('Idempotency-Key');if(!uuid(key))return res.status(400).json({message:'Identificador de envío inválido'});
 const result=await transaction(async c=>{
  const id=randomUUID();const inserted=await c.query('INSERT INTO marcela.consultation_requests(id,idempotency_key,payload) VALUES($1,$2,$3) ON CONFLICT(idempotency_key) DO NOTHING RETURNING id,status',[id,key,payload]);
  if(!inserted.rowCount){const old=(await c.query('SELECT id,status,payload FROM marcela.consultation_requests WHERE idempotency_key=$1',[key])).rows[0];if(JSON.stringify(old.payload)!==JSON.stringify(JSON.parse(JSON.stringify(payload)))){ // JSONB ordering differs: compare individual fields
   if(Object.keys(payload).some(k=>payload[k]!==old.payload[k]))throw Object.assign(new Error('El identificador ya fue utilizado'),{status:409});
  }return {id:old.id,status:old.status};}
  await c.query('INSERT INTO marcela.request_status_history(id,request_id,status) VALUES($1,$2,$3)',[randomUUID(),id,'RECIBIDA']);
  for(const [recipient,kind,body] of [[payload.email,'CONFIRMACION',`Recibí tu solicitud ${id}. Voy a revisar personalmente la información y me comunicaré con vos. Marcela Schpilberg.`],[process.env.MARCELA_EMAIL,'AVISO',`Nueva solicitud ${id}. Revisá el panel privado.`]]){
   if(!recipient)throw new Error('Destinatario administrativo sin configurar');
   await c.query('INSERT INTO marcela.notification_logs(id,request_id,recipient,kind,body) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,recipient,kind,body]);
  }return inserted.rows[0];
 });res.status(201).json(result);
});
app.use('/api/admin',(req,res,next)=>{const secret=process.env.ADMIN_TOKEN;const token=req.get('authorization')?.replace(/^Bearer /,'');if(!secret||secret.length<32||!token||!timingSafeEqual(createHash('sha256').update(secret).digest(),createHash('sha256').update(token).digest()))return res.status(401).json({message:'Acceso privado'});next();});
app.get('/api/admin/requests',async(req,res)=>{
 const {objective,area,status,from,to}=req.query;const args=[];let where=' WHERE true';
 for(const [expression,value] of [["payload->>'objective'",objective],["payload->>'area'",area],['status',status]])if(value){args.push(value);where+=` AND ${expression}=$${args.length}`;}
 for(const [operator,value] of [['>=',from],['<',to]])if(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return res.status(400).json({message:'Fecha inválida'});args.push(value);where+=` AND created_at ${operator} $${args.length}::date`;}
 res.json((await pool.query('SELECT * FROM marcela.consultation_requests'+where+' ORDER BY created_at DESC LIMIT 100',args)).rows);
});
app.use('/api/admin/requests/:id',(req,res,next)=>uuid(req.params.id)?next():res.status(400).json({message:'Identificador inválido'}));
app.get('/api/admin/requests/:id',async(req,res)=>{const request=(await pool.query('SELECT * FROM marcela.consultation_requests WHERE id=$1',[req.params.id])).rows[0];if(!request)return res.sendStatus(404);res.json({...request,messages:(await pool.query('SELECT * FROM marcela.consultation_messages WHERE request_id=$1 ORDER BY created_at',[req.params.id])).rows,history:(await pool.query('SELECT * FROM marcela.request_status_history WHERE request_id=$1 ORDER BY created_at',[req.params.id])).rows,notifications:(await pool.query('SELECT id,kind,status,attempts FROM marcela.notification_logs WHERE request_id=$1',[req.params.id])).rows});});
app.post('/api/admin/requests/:id/notes',async(req,res)=>{const body=req.body.body?.trim();if(!body||body.length>5000)return res.sendStatus(422);await pool.query('INSERT INTO marcela.consultation_messages(id,request_id,kind,body) VALUES($1,$2,$3,$4)',[randomUUID(),req.params.id,'INTERNA',body]);res.sendStatus(201);});
app.patch('/api/admin/requests/:id/status',async(req,res)=>{if(!['RECIBIDA','EN_REVISION','RESPONDIDA'].includes(req.body.status))return res.sendStatus(422);await transaction(async c=>{const row=(await c.query('SELECT status FROM marcela.consultation_requests WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];if(!row)throw Object.assign(new Error('Solicitud inexistente'),{status:404});await c.query('UPDATE marcela.consultation_requests SET status=$1,updated_at=now() WHERE id=$2',[req.body.status,req.params.id]);await c.query('INSERT INTO marcela.request_status_history(id,request_id,previous_status,status) VALUES($1,$2,$3,$4)',[randomUUID(),req.params.id,row.status,req.body.status]);});res.sendStatus(204);});
app.use((err,req,res,next)=>res.status(err.status||503).json({message:err.status?err.message:'No pudimos completar la operación. Intentá nuevamente.'}));
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL es obligatorio');
await transaction(async c=>{await c.query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));for(const category of catalog)await c.query('INSERT INTO marcela.consultation_categories VALUES($1,$2) ON CONFLICT DO NOTHING',[category.id,category]);});
app.listen(process.env.PORT||3001,'0.0.0.0');

const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, '..', 'public');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const {getWeather} = require('./weather');
async function handler(req,res){
  if(req.url === '/api/hello'){
    try {
      const weather = await getWeather();
      res.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
      return res.end(JSON.stringify({message:'Clima en Buenos Aires',weather,timestamp:new Date().toISOString(),architecture:`Browser → Node.js API → ${weather.source} → JSON → Browser`}));
    } catch (error) {
      res.writeHead(error.name === 'AbortError' ? 504 : 502, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
      return res.end(JSON.stringify({error:'No se pudo consultar el clima. Volvé a intentar.'}));
    }
  }
  const clean = req.url === '/' ? 'index.html' : req.url.replace(/^\//,'');
  const file = path.normalize(path.join(PUBLIC, clean));
  if(!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file,(err,data)=>{ if(err){res.writeHead(404);return res.end('Not found');} res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data); });
}
if(require.main === module) http.createServer(handler).listen(PORT,'0.0.0.0',()=>console.log(`SDD Hello Full Stack running on http://0.0.0.0:${PORT}`));
module.exports = handler;

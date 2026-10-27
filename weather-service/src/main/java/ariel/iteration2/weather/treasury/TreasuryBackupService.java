package ariel.iteration2.weather.treasury;

import ariel.iteration2.weather.database.DatabaseConnections;
import static ariel.iteration2.weather.treasury.TreasuryModels.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.sql.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.zip.*;

@Service
public class TreasuryBackupService {
 static final String RECIPIENT="aribecker2@gmail.com";
 static final long MAX_ATTACHMENTS=18L*1024*1024, MAX_SQL=100L*1024*1024;
 private final TreasuryRepository repository;
 private final String connection,key,from;
 private final ObjectMapper json;
 private final Map<String,Confirmation> confirmations=new LinkedHashMap<>();
 private Instant lastStarted=Instant.EPOCH;
 private boolean running;
 static class Confirmation {
  final String id=UUID.randomUUID().toString();final Instant expires=Instant.now().plusSeconds(900);
  final String date=LocalDate.now(ZoneId.of("America/Argentina/Buenos_Aires")).format(DateTimeFormatter.BASIC_ISO_DATE);
  byte[] zip,xlsx;Map<String,Object> result;
  List<String> files(){return List.of("Treasury Database-"+date+".zip","Treasury Database-"+date+".xlsx");}
 }
 public TreasuryBackupService(TreasuryRepository repository,@Value("${simulation.database-url:}")String connection,
  @Value("${treasury.backup.mail-api-key:}")String key,@Value("${treasury.backup.mail-from:}")String from,ObjectMapper json){this.repository=repository;this.connection=connection;this.key=key;this.from=from;this.json=json;}
 boolean configured(){return !key.isBlank()&&!from.isBlank();}
 public synchronized Map<String,Object> preview(){
  cleanup();for(var existing:confirmations.values())if(existing.result==null)return previewOf(existing);if(confirmations.size()>=100)throw new Problem(429,"Hay demasiadas confirmaciones pendientes. Reintentá más tarde.");
  var p=new Confirmation();confirmations.put(p.id,p);
  return previewOf(p);
 }
 private Map<String,Object> previewOf(Confirmation p){return Map.of("confirmation",p.id,"recipient",RECIPIENT,"files",p.files(),"date",p.date,"configured",configured());}
 private void cleanup(){confirmations.values().removeIf(c->c.expires.isBefore(Instant.now()));}
 public Map<String,Object> send(String token){return prepare(token,false);}
 public Map<String,Object> prepare(String token){return prepare(token,true);}
 private Map<String,Object> prepare(String token,boolean downloads){
  Confirmation p;
  synchronized(this){
   cleanup();p=confirmations.get(token);if(p==null)throw new Problem(409,"La confirmación venció. Recargá la pantalla para preparar un nuevo respaldo.");
   if(p.result!=null)return p.result;
   if(!downloads&&!configured())throw new Problem(503,"Falta configurar el remitente y la clave del servicio de correo en el servidor.");
   if(running)throw new Problem(409,"Ya hay un respaldo en curso. Esperá antes de reintentar.");
   if(lastStarted.plusSeconds(60).isAfter(Instant.now()))throw new Problem(429,"Esperá un minuto entre intentos de respaldo.");
   running=true;lastStarted=Instant.now();
  }
  try{
   if(p.zip==null){repository.ensureBackupReady();generate(p);}
   String id="";boolean accepted=false;
   if(configured())try{id=deliver(p);accepted=true;}catch(Exception mailFailure){if(!downloads)throw mailFailure;}
   synchronized(this){
    // Keep at most two downloadable snapshots in this single-instance application.
    var retained=confirmations.values().stream().filter(c->c!=p&&c.zip!=null).toList();
    for(int i=0;i<retained.size()-1;i++){retained.get(i).zip=null;retained.get(i).xlsx=null;}
    p.result=Map.of("recipient",RECIPIENT,"files",p.files(),"message_id",id,"mail_accepted",accepted,"downloads",List.of("/api/treasury/backup/files/"+p.id+"/zip","/api/treasury/backup/files/"+p.id+"/xlsx"));return p.result;
   }
  }catch(Problem e){throw e;}
  catch(InterruptedException e){Thread.currentThread().interrupt();throw new Problem(503,"Se interrumpió el respaldo. Reintentá con esta misma confirmación.");}
  catch(Exception e){throw new Problem(503,"No se pudo generar o enviar el respaldo. Reintentá con esta misma confirmación; no se informó un envío exitoso.");}
  finally{synchronized(this){running=false;}}
 }
 public record Download(String name,String type,byte[] bytes){}
 public synchronized Download download(String token,String format){
  cleanup();var p=confirmations.get(token);
  if(p==null||p.result==null||p.zip==null)throw new Problem(410,"Los archivos ya no están disponibles. Generá un nuevo respaldo.");
  return switch(format){case "zip"->new Download(p.files().get(0),"application/zip",p.zip);case "xlsx"->new Download(p.files().get(1),"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",p.xlsx);default->throw new Problem(404,"Archivo no encontrado.");};
 }
 void generate(Confirmation p)throws Exception{
  Path dir=Files.createTempDirectory("treasury-backup-");
  try{
   Path sql=dir.resolve("treasury.sql"),xlsx=dir.resolve("treasury.xlsx"),archive=dir.resolve("treasury.zip");
   try(var c=new DatabaseConnections(connection).open()){
    c.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);c.setReadOnly(true);c.setAutoCommit(false);
    try{
     String snapshot;try(var s=c.createStatement();var r=s.executeQuery("SELECT pg_export_snapshot()")){r.next();snapshot=r.getString(1);}
     var tables=TreasuryWorkbook.tables(c);dump(snapshot,sql,dir.resolve("stderr"));
     TreasuryWorkbook.write(c,xlsx,tables);
     try(var z=new ZipOutputStream(Files.newOutputStream(archive))){
      z.putNextEntry(new ZipEntry("Treasury Database-"+p.date+".sql"));Files.copy(sql,z);z.closeEntry();
      TreasuryWorkbook.entry(z,"README.txt",readme(p,tables));
     }
     if(Files.size(archive)+Files.size(xlsx)>MAX_ATTACHMENTS)throw new Problem(413,"El respaldo supera 18 MiB de adjuntos. No se envió ningún archivo: hace falta configurar una alternativa para respaldos más grandes.");
     byte[] zipBytes=Files.readAllBytes(archive),excelBytes=Files.readAllBytes(xlsx);p.zip=zipBytes;p.xlsx=excelBytes;c.rollback();
    }catch(Exception failure){c.rollback();throw failure;}
   }
  }finally{try(var paths=Files.walk(dir)){for(Path path:paths.sorted(Comparator.reverseOrder()).toList())Files.deleteIfExists(path);}}
 }
 private String readme(Confirmation p,List<String> tables){return "RESPALDO DE TESORERÍA\nFecha Buenos Aires: "+p.date+"\nAlcance: todo el esquema treasury, todas las instituciones. No incluye otros módulos.\nTablas: "+String.join(", ",tables)+"\n\nRESTAURACIÓN\nDescomprimir ZIP. Crear una base PostgreSQL VACÍA, versión 17 o posterior compatible.\nNo ejecutar contra la base de producción. Revisar el dump antes de restaurarlo.\nEjecutar, con credenciales suministradas de forma segura:\npsql --set ON_ERROR_STOP=on --single-transaction --dbname DESTINO --file \"Treasury Database-"+p.date+".sql\"\nEl script incluye estructura, claves, índices, datos, secuencias y comprobantes BYTEA.\nNo contiene contraseñas de conexión, propietarios ni permisos.\n\nEXCEL\nUna hoja por tabla; valores literales sin fórmulas. Fechas ISO; decimales como texto para conservar precisión. NULL: celda vacía; cadena vacía: texto vacío. Comprobantes BYTEA: base64; textos/base64 largos divididos en columnas [parte N/M]. Concatenar las partes en orden para recuperar el valor completo.\nEl SQL es el respaldo para restaurar; Excel es una exportación de consulta. Ambos usan el mismo snapshot consistente.\n";}
 void dump(String snapshot,Path output,Path errors)throws Exception{
  var process=new ProcessBuilder("pg_dump","--format=plain","--no-owner","--no-acl","--schema=treasury","--snapshot="+snapshot,"--lock-wait-timeout=5000","--no-password").redirectOutput(output.toFile()).redirectError(errors.toFile());
  process.environment().putAll(pgEnvironment(connection));process.environment().put("PGCONNECT_TIMEOUT","5");
  Process child=process.start();long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(45);
  try{
   while(!child.waitFor(200,TimeUnit.MILLISECONDS)){
    if(System.nanoTime()>deadline)throw new Problem(503,"La generación del dump excedió el tiempo máximo. No se envió ningún archivo.");
    if(Files.size(output)>MAX_SQL)throw new Problem(413,"El dump supera el tamaño máximo. No se envió ningún archivo.");
   }
   if(child.exitValue()!=0||Files.size(output)==0)throw new Problem(503,"No se pudo generar el dump PostgreSQL. No se envió ningún archivo.");
   if(Files.size(output)>MAX_SQL)throw new Problem(413,"El dump supera el tamaño máximo. No se envió ningún archivo.");
  }finally{if(child.isAlive()){child.destroyForcibly();child.waitFor(5,TimeUnit.SECONDS);}}
 }
 static Map<String,String> pgEnvironment(String raw){
  String url=raw.startsWith("jdbc:")?raw.substring(5):raw;URI uri=URI.create(url);var env=new HashMap<String,String>();
  if(!Set.of("postgres","postgresql").contains(uri.getScheme())||uri.getHost()==null)throw new Problem(503,"Configuración PostgreSQL no compatible con el respaldo.");
  env.put("PGHOST",uri.getHost());env.put("PGPORT",Integer.toString(uri.getPort()<0?5432:uri.getPort()));env.put("PGDATABASE",decode(uri.getRawPath().substring(1)));
  if(uri.getRawUserInfo()!=null){var auth=uri.getRawUserInfo().split(":",2);env.put("PGUSER",decode(auth[0]));if(auth.length==2)env.put("PGPASSWORD",decode(auth[1]));}
  if(uri.getRawQuery()!=null)for(String param:uri.getRawQuery().split("&")){var kv=param.split("=",2);if(kv.length!=2)continue;String name=decode(kv[0]),value=decode(kv[1]);switch(name){case "user"->env.put("PGUSER",value);case "password"->env.put("PGPASSWORD",value);case "sslmode"->env.put("PGSSLMODE",value);case "ssl"->{if("true".equals(value))env.put("PGSSLMODE","verify-full");}case "sslrootcert"->env.put("PGSSLROOTCERT",value);case "sslcert"->env.put("PGSSLCERT",value);case "sslkey"->env.put("PGSSLKEY",value);default->{}}}
  if(!env.containsKey("PGUSER"))throw new Problem(503,"Falta el usuario de PostgreSQL para generar el respaldo.");return env;
 }
 private static String decode(String s){return URLDecoder.decode(s.replace("+","%2B"),StandardCharsets.UTF_8);}
 String deliver(Confirmation p)throws Exception{
  var attachments=List.of(Map.of("filename",p.files().get(0),"content",Base64.getEncoder().encodeToString(p.zip)),Map.of("filename",p.files().get(1),"content",Base64.getEncoder().encodeToString(p.xlsx)));
  String payload=json.writeValueAsString(Map.of("from",from,"to",List.of(RECIPIENT),"subject","Respaldo de tesorería - "+p.date,"text","Se adjuntan el respaldo SQL comprimido y el Excel de todas las tablas de tesorería. El ZIP incluye las instrucciones de restauración.","attachments",attachments));
  var request=HttpRequest.newBuilder(URI.create("https://api.resend.com/emails")).timeout(Duration.ofSeconds(20)).header("Authorization","Bearer "+key).header("Content-Type","application/json").header("Idempotency-Key","treasury-backup-"+p.id).POST(HttpRequest.BodyPublishers.ofString(payload)).build();
  var response=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build().send(request,HttpResponse.BodyHandlers.ofString());
  if(response.statusCode()<200||response.statusCode()>=300)throw new Problem(502,"El servicio de correo no aceptó el respaldo. Reintentá con esta misma confirmación o revisá la configuración del remitente.");
  String id=json.readTree(response.body()).path("id").asText("");if(id.isBlank())throw new Problem(502,"No se pudo confirmar la aceptación del correo. Reintentá con esta misma confirmación.");return id;
 }
}

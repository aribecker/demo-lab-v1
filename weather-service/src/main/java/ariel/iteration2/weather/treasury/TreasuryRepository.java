package ariel.iteration2.weather.treasury;

import ariel.iteration2.weather.database.DatabaseConnections;
import static ariel.iteration2.weather.treasury.TreasuryModels.*;
import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Supplier;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.support.TransactionTemplate;

@Repository
public class TreasuryRepository {
 private final AbstractDataSource source;
 private final JdbcTemplate db;
 private final TransactionTemplate transaction;
 private volatile boolean ready;
 private final boolean configured;
 private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(TreasuryRepository.class);
 public TreasuryRepository(@Value("${simulation.database-url:}") String connection) {
  var connections=new DatabaseConnections(connection);
  configured=connections.configured();
  source=new AbstractDataSource(){
   public Connection getConnection()throws SQLException{return connections.open();}
   public Connection getConnection(String u,String p)throws SQLException{return getConnection();}
  };
  db=new JdbcTemplate(source);db.setQueryTimeout(20);
  transaction=new TransactionTemplate(new DataSourceTransactionManager(source));
 }
 @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
 public void prepare() {
  if(!configured)return;
  try{initialize();log.info("Treasury schema ready on shared PostgreSQL connection.");}
  catch(Problem failure){log.warn("Treasury schema unavailable; treasury requests will fail closed until storage recovers.");}
 }
 private synchronized void initialize() {
  if(ready)return;
  try {
   String schema;try(var c=source.getConnection()){schema=c.getMetaData().getDatabaseProductName().equals("H2")?"TREASURY":"treasury";}
   Flyway.configure().dataSource(source).schemas(schema).defaultSchema(schema).table("treasury_schema_history")
    .locations("classpath:db/treasury-migration").load().migrate();ready=true;
  }catch(Exception failure){throw new Problem(503,"La base de tesorería no está disponible. Reintentá en unos instantes.");}
 }
 private <T>T read(Supplier<T> action){initialize();return action.get();}
 private <T>T tx(Supplier<T> action){initialize();return transaction.execute(status->action.get());}
 private Map<String,Object> one(String sql,Object...args) {
  var rows=query(sql,args);if(rows.isEmpty())throw new Problem(404,"No se encontró el registro en esta institución.");return rows.get(0);
 }
 private List<Map<String,Object>> query(String sql,Object...args){
  return db.query(sql,(r,n)->{var row=new LinkedHashMap<String,Object>();var meta=r.getMetaData();
   for(int i=1;i<=meta.getColumnCount();i++){Object value=r.getObject(i);if(value instanceof BigDecimal amount)value=amount.toPlainString();if(value instanceof java.sql.Date date)value=date.toLocalDate().toString();if(value instanceof Timestamp time)value=time.toInstant().toString();row.put(meta.getColumnLabel(i).toLowerCase(Locale.ROOT),value);}return row;},args);
 }
 private String id(){return UUID.randomUUID().toString();}
 private Map<String,Object> institution(String inst,boolean writable) {
  var row=one("SELECT * FROM treasury.institutions WHERE id=?"+(writable?" FOR UPDATE":""),inst);
  if(writable&&!Boolean.TRUE.equals(row.get("active")))throw new Problem(409,"La institución está inactiva.");return row;
 }
 public List<Map<String,Object>> themes(){return read(()->query("SELECT * FROM treasury.themes ORDER BY id"));}
 public List<Map<String,Object>> institutions(){return read(()->query("SELECT i.*,t.primary_color,t.accent_color FROM treasury.institutions i JOIN treasury.themes t ON t.id=i.theme_id ORDER BY i.name"));}
 public String saveInstitution(String key,Institution form){final String institutionKey=key;return tx(()->{
  String target=institutionKey==null?id():institutionKey;
  String name=text(form.name(),160,true),code=text(form.code(),30,true).toUpperCase(Locale.ROOT),theme=text(form.theme_id(),30,true);
  one("SELECT id FROM treasury.themes WHERE id=?",theme);
  if(institutionKey==null){db.update("INSERT INTO treasury.institutions(id,name,code,theme_id,active) VALUES(?,?,?,?,?)",target,name,code,theme,form.active());}
  else {one("SELECT id FROM treasury.institutions WHERE id=? FOR UPDATE",target);db.update("UPDATE treasury.institutions SET name=?,code=?,theme_id=?,active=? WHERE id=?",name,code,theme,form.active(),target);}
  return target;
 });}
 public void deleteInstitution(String inst){tx(()->{
  one("SELECT id FROM treasury.institutions WHERE id=? FOR UPDATE",inst);
  long used=db.queryForObject("SELECT (SELECT COUNT(*) FROM treasury.accounts WHERE institution_id=?)+(SELECT COUNT(*) FROM treasury.members WHERE institution_id=?)+(SELECT COUNT(*) FROM treasury.journal_entries WHERE institution_id=?)",Long.class,inst,inst,inst);
  db.update(used>0?"UPDATE treasury.institutions SET active=FALSE WHERE id=?":"DELETE FROM treasury.institutions WHERE id=?",inst);return null;
 });}
 public List<Map<String,Object>> members(String inst){return read(()->{institution(inst,false);return query("SELECT * FROM treasury.members WHERE institution_id=? ORDER BY last_name,first_name",inst);});}
 public String saveMember(String inst,String key,Member f){final String memberKey=key;return tx(()->{
  institution(inst,true);String target=memberKey==null?id():memberKey;
  Object[] fields={text(f.first_name(),120,true),text(f.last_name(),120,true),text(f.residence(),240,false),text(f.membership_number(),50,false),text(f.email(),200,false),text(f.phone(),80,false),text(f.notes(),2000,false),f.active(),f.admission_date(),inst,target};
  if(memberKey==null)db.update("INSERT INTO treasury.members(first_name,last_name,residence,membership_number,email,phone,notes,active,admission_date,institution_id,id) VALUES(?,?,?,?,?,?,?,?,?,?,?)",fields);
  else {one("SELECT id FROM treasury.members WHERE institution_id=? AND id=?",inst,target);db.update("UPDATE treasury.members SET first_name=?,last_name=?,residence=?,membership_number=?,email=?,phone=?,notes=?,active=?,admission_date=? WHERE institution_id=? AND id=?",fields);}return target;
 });}
 public void deleteMember(String inst,String key){tx(()->{
  institution(inst,true);one("SELECT id FROM treasury.members WHERE institution_id=? AND id=?",inst,key);
  long used=db.queryForObject("SELECT COUNT(*) FROM treasury.journal_lines WHERE institution_id=? AND member_id=?",Long.class,inst,key);
  db.update(used>0?"UPDATE treasury.members SET active=FALSE WHERE institution_id=? AND id=?":"DELETE FROM treasury.members WHERE institution_id=? AND id=?",inst,key);return null;
 });}
 public List<Map<String,Object>> accounts(String inst){return read(()->{institution(inst,false);return query("SELECT * FROM treasury.accounts WHERE institution_id=? ORDER BY code",inst);});}
 public String saveAccount(String inst,String key,Account f){final String accountKey=key;return tx(()->{
  institution(inst,true);String target=accountKey==null?id():accountKey,parent=nullable(f.parent_id());
  String code=text(f.code(),30,true),name=text(f.name(),160,true);
  if(!Set.of("ASSET","LIABILITY","EQUITY","INCOME","EXPENSE").contains(Objects.toString(f.type(),""))||!Set.of("ARS","USD","BOTH").contains(Objects.toString(f.currency_policy(),"")))throw new Problem(400,"Tipo de cuenta o moneda inválidos.");
  if(parent!=null){var seen=new HashSet<String>();seen.add(target);String walk=parent;
   while(walk!=null){if(!seen.add(walk))throw new Problem(400,"La jerarquía de cuentas no puede contener ciclos.");var p=one("SELECT * FROM treasury.accounts WHERE institution_id=? AND id=?",inst,walk);
    if(!Boolean.TRUE.equals(p.get("active"))||Boolean.TRUE.equals(p.get("allows_posting")))throw new Problem(400,"La cuenta superior debe estar activa y ser agrupadora.");walk=(String)p.get("parent_id");}
  }
  if(accountKey!=null){var old=one("SELECT * FROM treasury.accounts WHERE institution_id=? AND id=?",inst,target);
   long used=db.queryForObject("SELECT COUNT(*) FROM treasury.journal_lines WHERE institution_id=? AND account_id=?",Long.class,inst,target);
   if(used>0&&(!f.type().equals(old.get("type"))||!f.currency_policy().equals(old.get("currency_policy"))||f.allows_posting()!=Boolean.TRUE.equals(old.get("allows_posting"))))throw new Problem(409,"Una cuenta con movimientos conserva su tipo, moneda y condición de imputación.");
   if(f.allows_posting()&&db.queryForObject("SELECT COUNT(*) FROM treasury.accounts WHERE institution_id=? AND parent_id=?",Long.class,inst,target)>0)throw new Problem(409,"Una cuenta con subcuentas debe ser agrupadora.");
  }
  Object[] fields={code,name,f.type(),parent,f.currency_policy(),f.allows_posting(),f.active(),inst,target};
  db.update(accountKey==null?"INSERT INTO treasury.accounts(code,name,type,parent_id,currency_policy,allows_posting,active,institution_id,id) VALUES(?,?,?,?,?,?,?,?,?)":"UPDATE treasury.accounts SET code=?,name=?,type=?,parent_id=?,currency_policy=?,allows_posting=?,active=? WHERE institution_id=? AND id=?",fields);return target;
 });}
 public void deleteAccount(String inst,String key){tx(()->{
  institution(inst,true);one("SELECT id FROM treasury.accounts WHERE institution_id=? AND id=?",inst,key);
  long used=db.queryForObject("SELECT (SELECT COUNT(*) FROM treasury.journal_lines WHERE institution_id=? AND account_id=?)+(SELECT COUNT(*) FROM treasury.accounts WHERE institution_id=? AND parent_id=?)",Long.class,inst,key,inst,key);
  db.update(used>0?"UPDATE treasury.accounts SET active=FALSE WHERE institution_id=? AND id=?":"DELETE FROM treasury.accounts WHERE institution_id=? AND id=?",inst,key);return null;
 });}
 public List<Map<String,Object>> entries(String inst){return read(()->{institution(inst,false);return query("SELECT e.*,(SELECT COUNT(*) FROM treasury.journal_attachments a WHERE a.journal_entry_id=e.id) AS attachment_count FROM treasury.journal_entries e WHERE institution_id=? ORDER BY entry_number DESC LIMIT 500",inst);});}
 private Map<String,Object> entry(String inst,String key,boolean draft){
  var e=one("SELECT * FROM treasury.journal_entries WHERE institution_id=? AND id=?",inst,key);
  if(draft&&!"DRAFT".equals(e.get("status")))throw new Problem(409,"Un asiento contabilizado es inmutable. Usá la reversión para corregirlo.");return e;
 }
 public Map<String,Object> detail(String inst,String key){return read(()->detailInternal(inst,key));}
 private Map<String,Object> detailInternal(String inst,String key){
  var e=entry(inst,key,false);
  e.put("lines",query("SELECT l.*,a.code AS account_code,a.name AS account_name,a.type AS account_type,m.first_name,m.last_name FROM treasury.journal_lines l JOIN treasury.accounts a ON a.id=l.account_id LEFT JOIN treasury.members m ON m.id=l.member_id WHERE l.institution_id=? AND journal_entry_id=? ORDER BY position",inst,key));
  e.put("attachments",query("SELECT id,file_name,content_type,file_size,description FROM treasury.journal_attachments WHERE institution_id=? AND journal_entry_id=? ORDER BY created_at,id",inst,key));return e;
 }
 public static BigDecimal money(BigDecimal value){
  if(value==null)return BigDecimal.ZERO.setScale(2);
  try{var v=value.setScale(2,java.math.RoundingMode.UNNECESSARY);if(v.signum()<0||v.precision()>18)throw new ArithmeticException();return v;}
  catch(ArithmeticException e){throw new Problem(400,"Los importes deben ser positivos y tener como máximo dos decimales.");}
 }
 private List<Line> validate(String inst,List<Line> lines,boolean posting){
  if(lines==null||lines.size()>200||(posting&&lines.size()<2))throw new Problem(400,"El asiento necesita al menos dos líneas para contabilizarse (máximo 200).");
  var clean=new ArrayList<Line>();var balance=new HashMap<String,BigDecimal>();
  for(var line:lines){
   if(line==null||!Set.of("ARS","USD").contains(Objects.toString(line.currency(),"")))throw new Problem(400,"Elegí ARS o USD.");
   var a=one("SELECT * FROM treasury.accounts WHERE institution_id=? AND id=?",inst,line.account_id());
   if(!Boolean.TRUE.equals(a.get("allows_posting"))||!Boolean.TRUE.equals(a.get("active")))throw new Problem(400,"La cuenta debe estar activa y admitir imputaciones.");
   if(!"BOTH".equals(a.get("currency_policy"))&&!line.currency().equals(a.get("currency_policy")))throw new Problem(400,"La moneda no está habilitada para esta cuenta.");
   String member=nullable(line.member_id());if(member!=null){var m=one("SELECT active FROM treasury.members WHERE institution_id=? AND id=?",inst,member);if(!Boolean.TRUE.equals(m.get("active")))throw new Problem(400,"El miembro está inactivo.");}
   BigDecimal debit=money(line.debit()),credit=money(line.credit());
   if((debit.signum()>0)==(credit.signum()>0))throw new Problem(400,"Cada línea debe tener un importe solamente en debe o en haber.");
   clean.add(new Line(line.account_id(),member,text(line.description(),500,false),line.currency(),debit,credit));
   balance.merge(line.currency(),debit.subtract(credit),BigDecimal::add);
  }
  if(posting&&balance.values().stream().anyMatch(v->v.signum()!=0))throw new Problem(400,"El debe y el haber deben coincidir por separado en ARS y USD.");
  return clean;
 }
 public String saveEntry(String inst,String key,Entry form,String actor){final String entryKey=key;return tx(()->{
  var institution=institution(inst,true);if(form.entry_date()==null)throw new Problem(400,"Elegí una fecha.");
  String concept=text(form.description(),1000,true),reference=text(form.reference(),200,false);
  var lines=validate(inst,form.lines(),false);String target=entryKey==null?id():entryKey;
  if(entryKey==null){long number=((Number)institution.get("next_entry")).longValue();
   db.update("INSERT INTO treasury.journal_entries(id,institution_id,entry_number,entry_date,description,reference,status,created_by) VALUES(?,?,?,?,?,?,'DRAFT',?)",target,inst,number,form.entry_date(),concept,reference,actor);
   db.update("UPDATE treasury.institutions SET next_entry=next_entry+1 WHERE id=?",inst);
  }else{entry(inst,target,true);db.update("UPDATE treasury.journal_entries SET entry_date=?,description=?,reference=? WHERE institution_id=? AND id=?",form.entry_date(),concept,reference,inst,target);db.update("DELETE FROM treasury.journal_lines WHERE institution_id=? AND journal_entry_id=?",inst,target);}
  insertLines(inst,target,lines);return target;
 });}
 private void insertLines(String inst,String key,List<Line> lines){int position=0;for(var l:lines)db.update("INSERT INTO treasury.journal_lines(id,institution_id,journal_entry_id,position,account_id,member_id,description,currency,debit,credit) VALUES(?,?,?,?,?,?,?,?,?,?)",id(),inst,key,++position,l.account_id(),l.member_id(),l.description(),l.currency(),l.debit(),l.credit());}
 private List<Line> lines(String inst,String key){return query("SELECT * FROM treasury.journal_lines WHERE institution_id=? AND journal_entry_id=? ORDER BY position",inst,key).stream().map(l->new Line((String)l.get("account_id"),(String)l.get("member_id"),(String)l.get("description"),(String)l.get("currency"),new BigDecimal((String)l.get("debit")),new BigDecimal((String)l.get("credit")))).toList();}
 public void post(String inst,String key){tx(()->{
  institution(inst,true);entry(inst,key,true);validate(inst,lines(inst,key),true);
  db.update("UPDATE treasury.journal_entries SET status='POSTED',posted_at=CURRENT_TIMESTAMP WHERE institution_id=? AND id=?",inst,key);return null;
 });}
 public void deleteEntry(String inst,String key){tx(()->{institution(inst,true);entry(inst,key,true);db.update("DELETE FROM treasury.journal_entries WHERE institution_id=? AND id=?",inst,key);return null;});}
 public String reverse(String inst,String key,Reversal form,String actor){return tx(()->{
  var institution=institution(inst,true);var old=entry(inst,key,false);
  if(!"POSTED".equals(old.get("status")))throw new Problem(400,"Solamente se revierten asientos contabilizados.");
  if(form.entry_date()==null||form.entry_date().isBefore(LocalDate.parse((String)old.get("entry_date"))))throw new Problem(400,"La fecha de reversión debe ser igual o posterior al asiento original.");
  String target=id();long number=((Number)institution.get("next_entry")).longValue();
  db.update("INSERT INTO treasury.journal_entries(id,institution_id,entry_number,entry_date,description,reference,status,reversal_of_id,created_by,posted_at) VALUES(?,?,?,?,?,?,'POSTED',?,?,CURRENT_TIMESTAMP)",target,inst,number,form.entry_date(),text(form.description(),1000,true),"Reversión #"+old.get("entry_number"),key,actor);
  var opposite=lines(inst,key).stream().map(l->new Line(l.account_id(),l.member_id(),l.description(),l.currency(),l.credit(),l.debit())).toList();
  insertLines(inst,target,opposite);db.update("UPDATE treasury.institutions SET next_entry=next_entry+1 WHERE id=?",inst);return target;
 });}
 public static String fileType(byte[] bytes){
  if(bytes==null||bytes.length<12||bytes.length>5242880)throw new Problem(400,"El archivo debe medir entre 12 bytes y 5 MB.");
  if((bytes[0]&255)==255&&(bytes[1]&255)==216&&(bytes[2]&255)==255)return "image/jpeg";
  if(Arrays.equals(Arrays.copyOf(bytes,8),new byte[]{(byte)137,80,78,71,13,10,26,10}))return "image/png";
  if(new String(bytes,0,4,java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")&&new String(bytes,8,4,java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP"))return "image/webp";
  if(new String(bytes,0,5,java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-"))return "application/pdf";
  throw new Problem(400,"Solamente se admiten imágenes JPEG, PNG, WebP o archivos PDF válidos.");
 }
 public String attach(String inst,String key,String name,byte[] bytes){String type=fileType(bytes);return tx(()->{
  institution(inst,true);entry(inst,key,true);
  if(db.queryForObject("SELECT COUNT(*) FROM treasury.journal_attachments WHERE institution_id=? AND journal_entry_id=?",Long.class,inst,key)>=10)throw new Problem(400,"Cada asiento admite hasta 10 comprobantes.");
  String attachment=id();String safe=text(name==null?"comprobante":name.replaceAll("[\\\\/\\p{Cntrl}]","_"),200,true);
  db.update("INSERT INTO treasury.journal_attachments(id,institution_id,journal_entry_id,file_name,content_type,file_size,file_data) VALUES(?,?,?,?,?,?,?)",attachment,inst,key,safe,type,bytes.length,bytes);return attachment;
 });}
 public Map<String,Object> attachment(String inst,String key,String attachment){return read(()->one("SELECT * FROM treasury.journal_attachments WHERE institution_id=? AND journal_entry_id=? AND id=?",inst,key,attachment));}
 public void deleteAttachment(String inst,String key,String attachment){tx(()->{
  institution(inst,true);entry(inst,key,true);one("SELECT id FROM treasury.journal_attachments WHERE institution_id=? AND journal_entry_id=? AND id=?",inst,key,attachment);
  db.update("DELETE FROM treasury.journal_attachments WHERE institution_id=? AND journal_entry_id=? AND id=?",inst,key,attachment);return null;
 });}
 public Map<String,Object> balance(String inst,LocalDate cutoff){return read(()->{
  var institution=institution(inst,false);
  var rows=query("SELECT a.id,a.code,a.name,a.type,a.parent_id,l.currency,SUM(l.debit) AS debit,SUM(l.credit) AS credit,SUM(l.debit-l.credit) AS net FROM treasury.journal_lines l JOIN treasury.accounts a ON a.id=l.account_id JOIN treasury.journal_entries e ON e.id=l.journal_entry_id WHERE l.institution_id=? AND e.status='POSTED' AND e.entry_date<=? GROUP BY a.id,a.code,a.name,a.type,a.parent_id,l.currency ORDER BY a.code,l.currency",inst,cutoff);
  return Map.of("institution",institution,"cutoff",cutoff.toString(),"rows",rows);
 });}
 public Map<String,Object> journal(String inst,LocalDate from,LocalDate to){return read(()->{
  if(from.isAfter(to))throw new Problem(400,"La fecha inicial no puede ser posterior a la final.");var institution=institution(inst,false);
  var headers=query("SELECT id FROM treasury.journal_entries WHERE institution_id=? AND status='POSTED' AND entry_date>=? AND entry_date<=? ORDER BY entry_date,entry_number LIMIT 501",inst,from,to);
  if(headers.size()>500)throw new Problem(413,"El informe supera 500 asientos. Elegí un período más corto.");
  var result=headers.stream().map(e->detailInternal(inst,(String)e.get("id"))).toList();
  return Map.of("institution",institution,"from",from.toString(),"to",to.toString(),"entries",result);
 });}
}

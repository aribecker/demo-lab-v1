package ariel.iteration2.weather.treasury;

import static org.junit.jupiter.api.Assertions.*;
import static ariel.iteration2.weather.treasury.TreasuryModels.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.io.TempDir;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.zip.*;
import java.io.*;

class TreasuryBackupPostgresTest {
 @TempDir Path dir;
 @Test @EnabledIfEnvironmentVariable(named="SIMULATION_TEST_DATABASE_URL",matches=".+")
 void restoresActualDumpAndKeepsWorkbookAtSameSnapshotAndSendsOnce()throws Exception{
  String admin=System.getenv("SIMULATION_TEST_DATABASE_URL");if(!admin.matches("jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/.*"))throw new IllegalArgumentException("Disposable loopback database required");
  String suffix=UUID.randomUUID().toString().replace("-",""),source="backup_src_"+suffix,target="backup_dst_"+suffix;
  String sourceUrl=admin.replaceFirst("/[^/?]+(?=\\?|$)","/"+source),targetUrl=admin.replaceFirst("/[^/?]+(?=\\?|$)","/"+target);
  try(var c=DriverManager.getConnection(admin);var s=c.createStatement()){s.execute("CREATE DATABASE "+source);s.execute("CREATE DATABASE "+target);}
  try{
   var repo=new TreasuryRepository(sourceUrl);String inst=repo.saveInstitution(null,new Institution("Prueba de backup","BACKUP","generic",true));
   repo.saveMember(inst,null,new Member("=FORMULA","Pérez","","001","","","",true,java.time.LocalDate.of(2020,1,2)));
   String entry=repo.saveEntry(inst,null,new Entry(java.time.LocalDate.now(),"Prueba de comprobante","",List.of()),"anonymous");
   byte[] binary="%PDF-1.7\nBinary test receipt".getBytes(java.nio.charset.StandardCharsets.UTF_8);repo.attach(inst,entry,"prueba.pdf",binary);
   final int[] sends={0};final byte[][] captured={null,null};
   var service=new TreasuryBackupService(repo,sourceUrl,"test-key","test@example.com",new ObjectMapper()){
    @Override void dump(String snapshot,Path out,Path err)throws Exception{
     super.dump(snapshot,out,err);
     // Committed after pg_dump: the workbook must still exclude this member.
     repo.saveMember(inst,null,new Member("AFTER_SNAPSHOT","Concurrente","","002","","","",true));
    }
    @Override String deliver(Confirmation p){sends[0]++;captured[0]=p.zip;captured[1]=p.xlsx;return "test-message-id";}
   };
   var preview=service.preview();String token=(String)preview.get("confirmation");var result=service.send(token);assertEquals(result,service.send(token));assertEquals(1,sends[0]);
   Path sql=dir.resolve("treasury.sql"),xlsx=dir.resolve("treasury.xlsx");Files.write(xlsx,captured[1]);
   try(var z=new ZipInputStream(new ByteArrayInputStream(captured[0]))){ZipEntry e;boolean found=false,readme=false;while((e=z.getNextEntry())!=null){if(e.getName().endsWith(".sql")){Files.write(sql,z.readAllBytes());found=true;}if(e.getName().equals("README.txt"))readme=true;}assertTrue(found&&readme);}
   var pb=new ProcessBuilder("psql","--set","ON_ERROR_STOP=on","--single-transaction","--file",sql.toString());pb.environment().putAll(TreasuryBackupService.pgEnvironment(targetUrl));pb.redirectErrorStream(true).redirectOutput(dir.resolve("restore.log").toFile());var process=pb.start();assertTrue(process.waitFor(30,TimeUnit.SECONDS));assertEquals(0,process.exitValue(),()->{try{return Files.readString(dir.resolve("restore.log"));}catch(Exception e){return "restore failed";}});
   try(var c=DriverManager.getConnection(targetUrl);var s=c.createStatement()){
    try(var r=s.executeQuery("SELECT first_name,admission_date FROM treasury.members")){assertTrue(r.next());assertEquals("=FORMULA",r.getString(1));assertEquals("2020-01-02",r.getString(2));assertFalse(r.next());}
    try(var r=s.executeQuery("SELECT file_data FROM treasury.journal_attachments")){assertTrue(r.next());assertArrayEquals(binary,r.getBytes(1));}
    try(var r=s.executeQuery("SELECT COUNT(*) FROM treasury.accounts")){r.next();assertEquals(0,r.getInt(1));}
    try(var r=s.executeQuery("SELECT COUNT(*) FROM treasury.treasury_schema_history WHERE success")){r.next();assertTrue(r.getInt(1)>=2);}
    assertThrows(SQLException.class,()->s.execute("INSERT INTO treasury.members(id,institution_id,first_name,last_name) VALUES('bad','missing','a','b')"));
   }
   try(var z=new ZipFile(xlsx.toFile())){
    String all="";for(var entries=z.entries();entries.hasMoreElements();){var e=entries.nextElement();if(e.getName().startsWith("xl/worksheets/"))all+=new String(z.getInputStream(e).readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);}
    assertTrue(all.contains("=FORMULA"));assertFalse(all.contains("AFTER_SNAPSHOT"));assertTrue(all.contains(Base64.getEncoder().encodeToString(binary)));assertEquals(8,z.stream().filter(e->e.getName().startsWith("xl/worksheets/")).count());
   }
  }finally{try(var c=DriverManager.getConnection(admin);var s=c.createStatement()){s.execute("DROP DATABASE "+source+" WITH (FORCE)");s.execute("DROP DATABASE "+target+" WITH (FORCE)");}}
 }
}

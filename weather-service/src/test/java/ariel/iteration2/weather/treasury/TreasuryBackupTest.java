package ariel.iteration2.weather.treasury;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import java.util.zip.*;
import java.io.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TreasuryBackupTest {
 @TempDir Path dir;
 @Test void connectionParsingDoesNotPutPasswordsInProcessArguments(){
  var env=TreasuryBackupService.pgEnvironment("postgresql://a%40b:s%3Ac%2Br%40t@host:6543/db%20name?sslmode=require");
  assertEquals("a@b",env.get("PGUSER"));assertEquals("s:c+r@t",env.get("PGPASSWORD"));assertEquals("db name",env.get("PGDATABASE"));assertEquals("6543",env.get("PGPORT"));assertEquals("require",env.get("PGSSLMODE"));
  assertEquals("x+y",TreasuryBackupService.pgEnvironment("jdbc:postgresql://host/db?user=me&password=x%2By").get("PGPASSWORD"));
 }
 @Test void previewDoesNotReadDatabaseOrSendAndMissingMailConfigFailsClosed(){
  var repo=mock(TreasuryRepository.class);var service=new TreasuryBackupService(repo,"","","",new ObjectMapper());var p=service.preview();
  assertEquals("aribecker2@gmail.com",p.get("recipient"));assertEquals(false,p.get("configured"));assertEquals(2,((List<?>)p.get("files")).size());
  assertThrows(TreasuryModels.Problem.class,()->service.send((String)p.get("confirmation")));assertThrows(TreasuryModels.Problem.class,()->service.send("forged"));verifyNoInteractions(repo);
 }
 @Test void downloadsSurviveMissingOrFailingMailAndAreIdempotent()throws Exception{
  for(String key:List.of("","configured")){
   var repo=mock(TreasuryRepository.class);int[] generations={0};
   var service=new TreasuryBackupService(repo,"",key,"sender@example.com",new ObjectMapper()){
    @Override void generate(Confirmation p){generations[0]++;p.zip=new byte[]{1,2};p.xlsx=new byte[]{3,4};}
    @Override String deliver(Confirmation p){throw new TreasuryModels.Problem(502,"mail failed");}
   };
   String token=(String)service.preview().get("confirmation");var result=service.prepare(token);
   assertEquals(false,result.get("mail_accepted"));assertEquals(result,service.prepare(token));assertEquals(1,generations[0]);
   assertArrayEquals(new byte[]{1,2},service.download(token,"zip").bytes());assertArrayEquals(new byte[]{3,4},service.download(token,"xlsx").bytes());assertThrows(TreasuryModels.Problem.class,()->service.download("forged","zip"));
  }
 }
 @Test void workbookContainsEmptyTablesExactDecimalsAndLiteralFormulaAndBinaryChunks()throws Exception{
  try(var c=DriverManager.getConnection("jdbc:h2:mem:backup-xlsx;MODE=PostgreSQL;DB_CLOSE_DELAY=-1")){
   c.createStatement().execute("CREATE SCHEMA treasury");c.createStatement().execute("CREATE TABLE treasury.full_table(id VARCHAR, amount NUMERIC(18,2), text_value VARCHAR, optional VARCHAR, receipt BYTEA)");c.createStatement().execute("CREATE TABLE treasury.empty_table(id VARCHAR)");
   byte[] bytes=new byte[40000];new Random(42).nextBytes(bytes);
   try(var s=c.prepareStatement("INSERT INTO treasury.full_table VALUES(?,?,?,?,?)")){s.setString(1,"001");s.setBigDecimal(2,new java.math.BigDecimal("9999999999999999.99"));s.setString(3,"=HYPERLINK(\"x\") & <tag>\r_x0041_");s.setNull(4,Types.VARCHAR);s.setBytes(5,bytes);s.executeUpdate();}
   var output=dir.resolve("test.xlsx");TreasuryWorkbook.write(c,output,List.of("EMPTY_TABLE","FULL_TABLE"));
   try(var z=new ZipFile(output.toFile())){
    String empty=new String(z.getInputStream(z.getEntry("xl/worksheets/sheet1.xml")).readAllBytes(),java.nio.charset.StandardCharsets.UTF_8),full=new String(z.getInputStream(z.getEntry("xl/worksheets/sheet2.xml")).readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);
    assertTrue(empty.contains("ID"));assertTrue(full.contains("9999999999999999.99"));assertTrue(full.contains("=HYPERLINK"));assertFalse(full.contains("<f>"));assertTrue(full.contains("_x000D_"));assertTrue(full.contains("_x005F_x0041_"));assertTrue(full.contains("parte 1/2"));assertTrue(full.contains(Base64.getEncoder().encodeToString(bytes).substring(30000)));assertTrue(full.contains("<c/>"));
   }
  }
 }
}

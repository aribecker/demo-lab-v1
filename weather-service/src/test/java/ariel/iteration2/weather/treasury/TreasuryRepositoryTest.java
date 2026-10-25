package ariel.iteration2.weather.treasury;

import static ariel.iteration2.weather.treasury.TreasuryModels.*;
import static org.assertj.core.api.Assertions.*;
import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

class TreasuryRepositoryTest {
 TreasuryRepository repo;String inst,other,cash,income,usd,member;
 final LocalDate date=LocalDate.of(2026,10,25);
 @BeforeEach void setup(){setup("jdbc:h2:mem:treasury-"+UUID.randomUUID()+";MODE=PostgreSQL;DB_CLOSE_DELAY=-1");}
 void setup(String url){repo=new TreasuryRepository(url);inst=repo.saveInstitution(null,new Institution("Mariners","M"+UUID.randomUUID().toString().substring(0,8),"mariners",true));other=repo.saveInstitution(null,new Institution("Marca","K"+UUID.randomUUID().toString().substring(0,8),"scottish",true));
  cash=account(inst,"1","Caja ARS","ARS");usd=account(inst,"2","Caja USD","USD");income=repo.saveAccount(inst,null,new Account("4","Cuotas","INCOME",null,"BOTH",true,true));
  member=repo.saveMember(inst,null,new Member("Ariel","Becker","CABA","1","","","",true));
 }
 String account(String tenant,String code,String name,String currency){return repo.saveAccount(tenant,null,new Account(code,name,"ASSET",null,currency,true,true));}
 Line line(String account,String currency,String debit,String credit){return new Line(account,member,"Cuota",currency,new BigDecimal(debit),new BigDecimal(credit));}
 Entry entry(List<Line> lines){return new Entry(date,"Cobro de cuotas","R-1",lines);}
 List<Line> balanced(){return List.of(line(cash,"ARS","123.45","0"),line(income,"ARS","0","123.45"),line(usd,"USD","100","0"),line(income,"USD","0","100"));}
 @Test void balancesIndependentlyKeepsDraftsOutAndReversesWithoutChangingOriginal(){
  String e=repo.saveEntry(inst,null,entry(balanced()),"owner");assertThat((List<?>)repo.balance(inst,date).get("rows")).isEmpty();repo.post(inst,e);
  assertThat((List<?>)repo.balance(inst,date.minusDays(1)).get("rows")).isEmpty();assertThat((List<?>)repo.balance(inst,date).get("rows")).hasSize(4);
  assertThatThrownBy(()->repo.saveEntry(inst,e,entry(balanced()),"owner")).isInstanceOf(Problem.class);
  assertThatThrownBy(()->repo.deleteEntry(inst,e)).isInstanceOf(Problem.class);
  String reversal=repo.reverse(inst,e,new Reversal(date,"Corrección"),"owner");assertThat(repo.detail(inst,e).get("status")).isEqualTo("POSTED");
  assertThat(repo.detail(inst,reversal).get("reversal_of_id")).isEqualTo(e);
  assertThat((List<Map<String,Object>>)repo.balance(inst,date).get("rows")).allSatisfy(r->assertThat(new BigDecimal((String)r.get("net"))).isEqualByComparingTo("0"));
  assertThatThrownBy(()->repo.reverse(inst,e,new Reversal(date,"Duplicada"),"owner")).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
 }
 @Test void rejectsCrossCurrencyCancellationAndInvalidPrecision(){
  String e=repo.saveEntry(inst,null,entry(List.of(line(cash,"ARS","100","0"),line(income,"USD","0","100"))),"owner");
  assertThatThrownBy(()->repo.post(inst,e)).isInstanceOf(Problem.class).hasMessageContaining("por separado");
  assertThat(repo.detail(inst,e).get("status")).isEqualTo("DRAFT");
  assertThatThrownBy(()->repo.saveEntry(inst,null,entry(List.of(line(cash,"ARS","0.001","0"))),"owner")).isInstanceOf(Problem.class);
  assertThatThrownBy(()->repo.saveEntry(inst,null,entry(List.of(line(cash,"USD","100","0"))),"owner")).isInstanceOf(Problem.class);
  assertThatThrownBy(()->repo.saveEntry(inst,null,entry(List.of(line(cash,"ARS","100","100"))),"owner")).isInstanceOf(Problem.class);
 }
 @Test void preventsCrossInstitutionReferencesAndUnrelatedReads(){
  String foreign=account(other,"1","Otra caja","ARS");
  assertThatThrownBy(()->repo.saveEntry(inst,null,entry(List.of(line(foreign,"ARS","10","0"))),"owner")).isInstanceOf(Problem.class);
  String foreignMember=repo.saveMember(other,null,new Member("Otro","Miembro","","","","","",true));
  assertThatThrownBy(()->repo.saveEntry(inst,null,entry(List.of(new Line(cash,foreignMember,"","ARS",BigDecimal.TEN,BigDecimal.ZERO))),"owner")).isInstanceOf(Problem.class);
  String e=repo.saveEntry(inst,null,entry(balanced()),"owner");
  assertThatThrownBy(()->repo.detail(other,e)).isInstanceOf(Problem.class);assertThat(repo.entries(other)).isEmpty();
  assertThatThrownBy(()->repo.post(other,e)).isInstanceOf(Problem.class);
 }
 byte[] png(){byte[] b=new byte[20];System.arraycopy(new byte[]{(byte)137,80,78,71,13,10,26,10},0,b,0,8);return b;}
 @Test void storesManyAttachmentsRejectsExecutableTypesAndLocksPostedReceipts(){
  String e=repo.saveEntry(inst,null,entry(balanced()),"owner");String receipt=repo.attach(inst,e,"foto.png",png());
  assertThat((byte[])repo.attachment(inst,e,receipt).get("file_data")).isEqualTo(png());
  assertThatThrownBy(()->repo.attachment(other,e,receipt)).isInstanceOf(Problem.class);
  assertThatThrownBy(()->repo.attach(inst,e,"evil.html","<html><script>alert(1)</script>".getBytes())).isInstanceOf(Problem.class);
  for(int i=0;i<9;i++)repo.attach(inst,e,"foto"+i+".png",png());
  assertThatThrownBy(()->repo.attach(inst,e,"extra.png",png())).isInstanceOf(Problem.class);
  repo.deleteAttachment(inst,e,receipt);assertThat((List<?>)repo.detail(inst,e).get("attachments")).hasSize(9);
  repo.post(inst,e);assertThatThrownBy(()->repo.attach(inst,e,"foto.png",png())).isInstanceOf(Problem.class);
  var another=(String)((List<Map<String,Object>>)repo.detail(inst,e).get("attachments")).get(0).get("id");
  assertThatThrownBy(()->repo.deleteAttachment(inst,e,another)).isInstanceOf(Problem.class);
 }
 @Test void enforcesHierarchyAndPreservesUsedAccountsAndMembers(){
  String parent=repo.saveAccount(inst,null,new Account("9","Activo agrupador","ASSET",null,"BOTH",false,true));
  String child=repo.saveAccount(inst,null,new Account("9.1","Subgrupo","ASSET",parent,"BOTH",false,true));
  assertThatThrownBy(()->repo.saveAccount(inst,parent,new Account("9","Ciclo","ASSET",child,"BOTH",false,true))).isInstanceOf(Problem.class);
  String e=repo.saveEntry(inst,null,entry(balanced()),"owner");repo.post(inst,e);repo.deleteAccount(inst,cash);repo.deleteMember(inst,member);
  assertThat(repo.accounts(inst).stream().filter(a->cash.equals(a.get("id"))).findFirst().get().get("active")).isEqualTo(false);
  assertThat(repo.members(inst).get(0).get("active")).isEqualTo(false);
  repo.deleteInstitution(inst);assertThat(repo.institutions().stream().filter(i->inst.equals(i.get("id"))).findFirst().get().get("active")).isEqualTo(false);
  assertThat(repo.detail(inst,e)).isNotEmpty();assertThatThrownBy(()->repo.saveEntry(inst,null,entry(balanced()),"owner")).isInstanceOf(Problem.class);
 }
 @Test void foreignKeysAlsoRejectCrossTenantWritesDirectly()throws Exception {
  String url="jdbc:h2:mem:fk-"+UUID.randomUUID()+";MODE=PostgreSQL;DB_CLOSE_DELAY=-1";setup(url);
  String e=repo.saveEntry(inst,null,entry(balanced()),"owner"),foreign=account(other,"x","Otra","ARS");
  try(var c=DriverManager.getConnection(url);var st=c.prepareStatement("UPDATE treasury.journal_lines SET account_id=? WHERE institution_id=? AND journal_entry_id=?")){
   st.setString(1,foreign);st.setString(2,inst);st.setString(3,e);assertThatThrownBy(st::executeUpdate).isInstanceOf(SQLException.class);
  }
 }
 @Test void persistsAcrossRepositoryInstancesAndSerializesEntryNumbers()throws Exception {
  String url="jdbc:h2:mem:restart-"+UUID.randomUUID()+";MODE=PostgreSQL;DB_CLOSE_DELAY=-1";setup(url);
  var executor=java.util.concurrent.Executors.newFixedThreadPool(4);try{
   var jobs=new ArrayList<java.util.concurrent.Future<String>>();for(int i=0;i<8;i++)jobs.add(executor.submit(()->repo.saveEntry(inst,null,entry(balanced()),"owner")));
   for(var job:jobs)assertThat(job.get()).isNotBlank();
  }finally{executor.shutdownNow();}
  var restarted=new TreasuryRepository(url);assertThat(restarted.entries(inst)).hasSize(8);
  assertThat(restarted.entries(inst).stream().map(e->((Number)e.get("entry_number")).longValue())).doesNotHaveDuplicates();
 }
 @Test @EnabledIfEnvironmentVariable(named="SIMULATION_TEST_DATABASE_URL",matches=".+")
 void postgresMigrationPersistenceAndExplorerPrivacy()throws Exception {
  String admin=System.getenv("SIMULATION_TEST_DATABASE_URL");if(!admin.matches("jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/.*"))throw new IllegalArgumentException("Disposable loopback database required");
  String name="treasury_test_"+UUID.randomUUID().toString().replace("-","");
  try(var c=DriverManager.getConnection(admin);var st=c.createStatement()){st.execute("CREATE DATABASE "+name);}
  String url=admin.replaceFirst("/[^/?]+(?=\\?|$)","/"+name);
  try{setup(url);balancesIndependentlyKeepsDraftsOutAndReversesWithoutChangingOriginal();storesManyAttachmentsRejectsExecutableTypesAndLocksPostedReceipts();
   var explorer=new ariel.iteration2.weather.database.DatabaseExplorerRepository(url);
   assertThat(explorer.catalog().schemas()).noneMatch(s->s.name().equals("treasury"));
   assertThatThrownBy(()->explorer.rows("treasury","members",0,25)).isInstanceOf(ariel.iteration2.weather.database.DatabaseExplorerRepository.NotFound.class);
  }finally{try(var c=DriverManager.getConnection(admin);var st=c.createStatement()){st.execute("DROP DATABASE "+name+" WITH (FORCE)");}}
 }
}

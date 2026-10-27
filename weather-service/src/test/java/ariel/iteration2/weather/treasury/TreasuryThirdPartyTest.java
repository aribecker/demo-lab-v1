package ariel.iteration2.weather.treasury;
import static ariel.iteration2.weather.treasury.TreasuryModels.*;
import static org.assertj.core.api.Assertions.*;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.*;

class TreasuryThirdPartyTest {
 TreasuryRepositoryTest f;
 @BeforeEach void setup(){f=new TreasuryRepositoryTest();f.setup();}
 Account account(boolean member,boolean supplier,String auxiliary){return new Account("CTRL","Control","ASSET",null,"BOTH",true,true,member,supplier,auxiliary);}
 @Test void requiresMemberOnBothSidesAndAllowsOptionalMember(){
  String a=f.repo.saveAccount(f.inst,null,account(true,false,null));
  for(boolean debit:List.of(true,false)){
   var line=new Line(a,null,"","ARS",debit?BigDecimal.TEN:BigDecimal.ZERO,debit?BigDecimal.ZERO:BigDecimal.TEN);
   assertThatThrownBy(()->f.repo.saveEntry(f.inst,null,f.entry(List.of(line)),"actor")).isInstanceOf(Problem.class).hasMessageContaining("miembro");
   String e=f.repo.saveEntry(f.inst,null,f.entry(List.of(new Line(a,f.member,"","ARS",line.debit(),line.credit()))),"actor");
   assertThat(f.repo.detail(f.inst,e)).isNotEmpty();
  }
  assertThat(f.repo.saveEntry(f.inst,null,f.entry(List.of(new Line(f.cash,null,"","ARS",BigDecimal.ONE,BigDecimal.ZERO))),"actor")).isNotBlank();
 }
 @Test void supplierRequiredScopedPersistedAndRetainedOnReversal(){
  String supplier=f.repo.saveSupplier(f.inst,null,new SupplierForm("Proveedor","REF","","",true));
  String a=f.repo.saveAccount(f.inst,null,account(false,true,null));
  for(boolean debit:List.of(true,false)){
   var line=new Line(a,null,"","ARS",debit?BigDecimal.TEN:BigDecimal.ZERO,debit?BigDecimal.ZERO:BigDecimal.TEN);
   assertThatThrownBy(()->f.repo.saveEntry(f.inst,null,f.entry(List.of(line)),"actor")).isInstanceOf(Problem.class).hasMessageContaining("proveedor");
  }
  String e=f.repo.saveEntry(f.inst,null,f.entry(List.of(new Line(a,null,"","ARS",BigDecimal.TEN,BigDecimal.ZERO,supplier),new Line(f.income,null,"","ARS",BigDecimal.ZERO,BigDecimal.TEN))),"actor");
  f.repo.post(f.inst,e);String r=f.repo.reverse(f.inst,e,new Reversal(f.date,"Corrección"),"actor");
  assertThat((List<Map<String,Object>>)f.repo.detail(f.inst,r).get("lines")).anySatisfy(l->assertThat(l).containsEntry("supplier_id",supplier));
  assertThatThrownBy(()->f.repo.saveEntry(f.other,null,f.entry(List.of(new Line(f.account(f.other,"X","Caja","ARS"),null,"","ARS",BigDecimal.TEN,BigDecimal.ZERO,supplier))),"actor")).isInstanceOf(Problem.class);
  f.repo.deactivateSupplier(f.inst,supplier);assertThat(f.repo.suppliers(f.inst).get(0)).containsEntry("active",false);
 }
 @Test void controlAccountsRejectUnlinkedManualEntriesAndCannotBeAssignedToUsedAccounts(){
  String a=f.repo.saveAccount(f.inst,null,account(true,false,"MEMBER_DEBT"));
  assertThatThrownBy(()->f.repo.saveEntry(f.inst,null,f.entry(List.of(new Line(a,f.member,"","ARS",BigDecimal.TEN,BigDecimal.ZERO))),"actor")).isInstanceOf(Problem.class).hasMessageContaining("documento operativo");
  String e=f.repo.saveEntry(f.inst,null,f.entry(f.balanced()),"actor");f.repo.post(f.inst,e);
  assertThatThrownBy(()->f.repo.saveAccount(f.inst,f.cash,new Account("1","Caja ARS","ASSET",null,"ARS",true,true,true,false,"MEMBER_DEBT"))).isInstanceOf(Problem.class);
 }
 @Test void migrationPreservesPreviouslyPostedEntriesAndDoesNotGrantUsers()throws Exception {
  String url="jdbc:h2:mem:upgrade-v3-"+UUID.randomUUID()+";MODE=PostgreSQL;DB_CLOSE_DELAY=-1";
  org.flywaydb.core.Flyway.configure().dataSource(url,"","").schemas("TREASURY").defaultSchema("TREASURY").table("treasury_schema_history").locations("classpath:db/treasury-migration").target("2").load().migrate();
  try(var c=java.sql.DriverManager.getConnection(url);var st=c.createStatement()){
   st.execute("INSERT INTO treasury.institutions(id,name,code,theme_id) VALUES('i','Legacy','LEG','generic')");
   st.execute("INSERT INTO treasury.accounts(id,institution_id,code,name,type,currency_policy) VALUES('a','i','1','Cash','ASSET','ARS'),('b','i','4','Income','INCOME','ARS')");
   st.execute("INSERT INTO treasury.journal_entries(id,institution_id,entry_number,entry_date,description,status,created_by) VALUES('e','i',1,DATE '2026-10-22','Historical','POSTED','anonymous')");
   st.execute("INSERT INTO treasury.journal_lines(id,institution_id,journal_entry_id,position,account_id,currency,debit,credit) VALUES('l1','i','e',1,'a','ARS',40,0),('l2','i','e',2,'b','ARS',0,40)");
  }
  var repo=new TreasuryRepository(url);
  assertThat(repo.entries("i")).hasSize(1);assertThat(repo.detail("i","e")).containsEntry("description","Historical").containsEntry("created_by","anonymous");
  assertThat((List<?>)repo.detail("i","e").get("lines")).hasSize(2);
  assertThat(repo.permitted("i","google","some-user","can_write")).isFalse();
  assertThat(repo.accounts("i")).allSatisfy(a->assertThat(a).containsEntry("requires_member",false));
 }
}

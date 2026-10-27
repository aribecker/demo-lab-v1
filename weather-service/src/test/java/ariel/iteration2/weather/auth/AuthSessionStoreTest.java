package ariel.iteration2.weather.auth;

import ariel.iteration2.weather.database.DatabaseConnections;
import ariel.iteration2.weather.database.DatabaseExplorerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.*;
import java.time.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import static org.assertj.core.api.Assertions.*;

class AuthSessionStoreTest {
 final ObjectMapper json=new ObjectMapper();
 final Instant now=Instant.parse("2026-10-25T12:00:00Z");
 final DemoSessions.Profile owner=new DemoSessions.Profile("google","123","Ariel Becker","aribecker2@gmail.com",null,null,null,true);
 String h2(){return "jdbc:h2:mem:persistent-"+UUID.randomUUID()+";MODE=PostgreSQL;DB_CLOSE_DELAY=-1";}
 void contract(String url)throws Exception {
  var clock=Clock.fixed(now,ZoneOffset.UTC);var firstStore=new AuthSessionStore(url,json);var first=new DemoSessions(clock,firstStore);
  String verifier="v".repeat(43);var login=first.exchange(first.issue(owner,DemoSessions.digest(verifier)),verifier);
  assertThat(login.expiresAt()).isEqualTo(now.plusSeconds(604800));
  var restartedStore=new AuthSessionStore(url,json);var restarted=new DemoSessions(clock,restartedStore);
  assertThat(restarted.find(login.token()).canUseSimulator()).isTrue();
  assertThat(restarted.find("x".repeat(43))).isNull();
  assertThat(restartedStore.find(DemoSessions.digest(login.token()),now.plusSeconds(604799))).isNotNull();
  assertThat(restartedStore.find(DemoSessions.digest(login.token()),now.plusSeconds(604800))).isNull();
  try(var c=new DatabaseConnections(url).open();var st=c.createStatement();var rows=st.executeQuery("SELECT token_hash,profile,created_at,expires_at FROM auth_private.application_sessions")) {
   assertThat(rows.next()).isTrue();assertThat(rows.getString(1)).isEqualTo(DemoSessions.digest(login.token())).isNotEqualTo(login.token());
   assertThat(rows.getString(2)).doesNotContain(login.token());
   assertThat(rows.getTimestamp(4).toInstant()).isEqualTo(rows.getTimestamp(3).toInstant().plusSeconds(604800));
  }
  restarted.revoke(login.token());assertThat(first.find(login.token())).isNull();restarted.revoke(login.token());
  assertThat(new AuthSessionStore(url,json).find(DemoSessions.digest(login.token()),now)).isNull();
 }
 @Test void restoresAcrossInstancesAndRevokesWithExactSevenDayExpiry()throws Exception {contract(h2());}
 @Test void cleansOnlyExpiredAuthRowsAndKeepsUnrelatedTables()throws Exception {
  String url=h2();try(var c=new DatabaseConnections(url).open();var st=c.createStatement()) {
   st.execute("CREATE TABLE public.persistent_sentinel(id INTEGER PRIMARY KEY)");st.execute("INSERT INTO public.persistent_sentinel VALUES(1)");
  }
  var store=new AuthSessionStore(url,json);store.save(DemoSessions.digest("a"),owner,now,now.plusSeconds(1));
  store.save(DemoSessions.digest("b"),owner,now.plusSeconds(2),now.plusSeconds(604802));
  try(var c=new DatabaseConnections(url).open();var st=c.createStatement()) {
   try(var rows=st.executeQuery("SELECT COUNT(*) FROM auth_private.application_sessions")){rows.next();assertThat(rows.getInt(1)).isEqualTo(1);}
   try(var rows=st.executeQuery("SELECT COUNT(*) FROM public.persistent_sentinel")){rows.next();assertThat(rows.getInt(1)).isEqualTo(1);}
   try(var rows=st.executeQuery("SELECT COUNT(*) FROM auth_private.\"session_schema_history\" WHERE \"version\"='1' AND \"success\"=TRUE")){rows.next();assertThat(rows.getInt(1)).isEqualTo(1);}
  }
 }
 @Test void storageFailureNeverFallsBackToAnInMemorySession() {
  var sessions=new DemoSessions(Clock.fixed(now,ZoneOffset.UTC),new AuthSessionStore("",json));String v="a".repeat(43);
  String ticket=sessions.issue(owner,DemoSessions.digest(v));
  assertThatThrownBy(()->sessions.exchange(ticket,v)).isInstanceOf(AuthSessionStore.Unavailable.class);
  assertThatThrownBy(()->sessions.find("x".repeat(43))).isInstanceOf(AuthSessionStore.Unavailable.class);
 }
 @Test @EnabledIfEnvironmentVariable(named="SIMULATION_TEST_DATABASE_URL",matches=".+")
 void postgresMigrationRestartAndExplorerPrivacy()throws Exception {
  String admin=System.getenv("SIMULATION_TEST_DATABASE_URL");
  if(!admin.matches("jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/.*"))throw new IllegalArgumentException("Disposable loopback database required");
  String name="auth_test_"+UUID.randomUUID().toString().replace("-","");
  try(var c=DriverManager.getConnection(admin);var st=c.createStatement()){st.execute("CREATE DATABASE "+name);}
  String url=admin.replaceFirst("/[^/?]+(?=\\?|$)","/"+name);
  try {
   contract(url);var explorer=new DatabaseExplorerRepository(url);
   assertThat(explorer.catalog().schemas()).noneMatch(schema->schema.name().equals("auth_private"));
   assertThatThrownBy(()->explorer.rows("auth_private","application_sessions",0,25)).isInstanceOf(DatabaseExplorerRepository.NotFound.class);
   assertThatThrownBy(()->explorer.rows("auth_private","session_schema_history",0,25)).isInstanceOf(DatabaseExplorerRepository.NotFound.class);
  }finally{try(var c=DriverManager.getConnection(admin);var st=c.createStatement()){st.execute("DROP DATABASE "+name+" WITH (FORCE)");}}
 }
}

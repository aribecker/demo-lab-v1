package ariel.iteration2.weather.access;
import ariel.iteration2.weather.auth.DemoSessions;
import java.util.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class AccessDirectoryTest {
 String url(){return "jdbc:h2:mem:access-"+UUID.randomUUID()+";MODE=PostgreSQL;DB_CLOSE_DELAY=-1";}
 DemoSessions.Profile profile(String email,boolean verified){return new DemoSessions.Profile("google",email,email,email,null,null,null,verified);}
 @Test void initialSeedEveryoneOwnerAndIndependentGroups(){
  var db=new AccessDirectory(url(),true);
  assertThat(db.capabilities(null)).isEqualTo(new AccessDirectory.Capabilities(true,false,false));
  assertThat(db.capabilities(profile("ARIBECKER2@gmail.com",true))).isEqualTo(new AccessDirectory.Capabilities(true,true,true));
  assertThat(db.users()).hasSize(2);assertThat(db.groups()).hasSize(3);
  assertThat(db.capabilities(profile("aribecker2@gmail.com",false)).canManageGroups()).isFalse();
 }
 @Test void crudAndRevocationPersistAcrossRestart(){
  String url=url();var db=new AccessDirectory(url,true);
  var user=db.createUser(new AccessDirectory.UserInput("Jane","Doe"," JANE@example.test "));
  assertThat(user.email()).isEqualTo("jane@example.test");
  var group=db.createGroup(new AccessDirectory.GroupInput("User editors",List.of("USERS")));
  db.replaceMembers(group.id(),new AccessDirectory.MemberInput(List.of(user.id())));
  assertThat(db.capabilities(profile(user.email(),true))).isEqualTo(new AccessDirectory.Capabilities(true,true,false));
  assertThat(db.capabilities(profile(user.email(),false)).canManageUsers()).isFalse();
  db.updateUser(user.id(),new AccessDirectory.UserInput("Janet","Doe","jane@example.test"));
  assertThat(db.users().stream().filter(u->u.id()==user.id()).findFirst().get().firstName()).isEqualTo("Janet");
  var simulator=db.groups().stream().filter(g->g.permissions().contains("SIMULATOR")).findFirst().get();
  var owner=db.users().stream().filter(u->"owner".equals(u.systemKey())).findFirst().get();
  db.replaceMembers(simulator.id(),new AccessDirectory.MemberInput(List.of(owner.id())));
  assertThat(db.capabilities(null).canUseSimulator()).isFalse();
  assertThat(new AccessDirectory(url,true).capabilities(null).canUseSimulator()).isFalse();
  db.replaceMembers(group.id(),new AccessDirectory.MemberInput(List.of()));
  assertThat(db.capabilities(profile(user.email(),true)).canManageUsers()).isFalse();
  db.deleteGroup(group.id());db.deleteUser(user.id());assertThat(db.users()).hasSize(2);
 }
 @Test void reservedPrincipalsAndLastAdminCannotBeRemoved(){
  var db=new AccessDirectory(url(),true);var users=db.users();
  var everyone=users.stream().filter(u->"EVERYONE".equals(u.principalKind())).findFirst().get();
  var owner=users.stream().filter(u->"owner".equals(u.systemKey())).findFirst().get();
  var admins=db.groups().stream().filter(g->g.permissions().contains("GROUPS")).findFirst().get();
  assertThatThrownBy(()->db.deleteUser(everyone.id())).isInstanceOf(AccessDirectory.Problem.class);
  assertThatThrownBy(()->db.deleteUser(owner.id())).isInstanceOf(AccessDirectory.Problem.class);
  assertThatThrownBy(()->db.deleteGroup(admins.id())).isInstanceOf(AccessDirectory.Problem.class);
  assertThatThrownBy(()->db.replaceMembers(admins.id(),new AccessDirectory.MemberInput(List.of(everyone.id())))).isInstanceOf(AccessDirectory.Problem.class);
  assertThat(db.members(admins.id()).memberIds()).containsExactly(owner.id());
  assertThatThrownBy(()->db.updateGroup(admins.id(),new AccessDirectory.GroupInput("No admin",List.of("SIMULATOR")))).isInstanceOf(AccessDirectory.Problem.class);
 }
 @Test void duplicateAndInvalidInputRollbackAndEveryoneCanBeAssignedExplicitly(){
  var db=new AccessDirectory(url(),false);var owner=db.users().get(0);
  assertThatThrownBy(()->db.createUser(new AccessDirectory.UserInput("A","B","bad"))).isInstanceOf(AccessDirectory.Problem.class);
  assertThatThrownBy(()->db.createUser(new AccessDirectory.UserInput("A","B",owner.email().toUpperCase()))).isInstanceOf(AccessDirectory.Problem.class);
  assertThatThrownBy(()->db.createGroup(new AccessDirectory.GroupInput("Broken",List.of("UNKNOWN")))).isInstanceOf(AccessDirectory.Problem.class);
  var group=db.createGroup(new AccessDirectory.GroupInput("Public users",List.of("USERS")));
  long everyone=db.users().stream().filter(u->"EVERYONE".equals(u.principalKind())).findFirst().get().id();
  db.replaceMembers(group.id(),new AccessDirectory.MemberInput(List.of(everyone)));
  assertThat(db.capabilities(null).canManageUsers()).isTrue();
 }
 @Test void missingStorageNeverAllowsEveryone(){assertThatThrownBy(()->new AccessDirectory("",true).capabilities(null)).isInstanceOf(AccessDirectory.Problem.class);}

 @Test @org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable(named="SIMULATION_TEST_DATABASE_URL",matches=".+")
 void postgresMigrationRestartAndPrivateExplorerSchema()throws Exception {
  String admin=System.getenv("SIMULATION_TEST_DATABASE_URL");
  if(!admin.matches("jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/.*"))throw new IllegalArgumentException("Disposable loopback PostgreSQL required");
  String name="access_test_"+UUID.randomUUID().toString().replace("-","");
  try(var c=java.sql.DriverManager.getConnection(admin);var st=c.createStatement()){st.execute("CREATE DATABASE "+name);}
  String url=admin.replaceFirst("/[^/?]+(?=\\?|$)","/"+name);
  try {
   var db=new AccessDirectory(url,true);assertThat(db.capabilities(null).canUseSimulator()).isTrue();
   assertThat(db.capabilities(profile("aribecker2@gmail.com",true)).canManageGroups()).isTrue();
   assertThat(new ariel.iteration2.weather.database.DatabaseExplorerRepository(url).catalog().schemas()).noneMatch(schema->schema.name().equals("demo_lab"));
   var group=db.groups().stream().filter(g->g.permissions().contains("SIMULATOR")).findFirst().get();
   db.replaceMembers(group.id(),new AccessDirectory.MemberInput(List.of()));
   assertThat(new AccessDirectory(url,true).capabilities(null).canUseSimulator()).isFalse();
  }finally{try(var c=java.sql.DriverManager.getConnection(admin);var st=c.createStatement()){st.execute("DROP DATABASE "+name+" WITH (FORCE)");}}
 }
}

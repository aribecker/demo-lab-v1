package ariel.iteration2.weather.access;

import ariel.iteration2.weather.auth.DemoSessions;
import ariel.iteration2.weather.database.DatabaseConnections;
import java.sql.*;
import java.util.*;
import java.util.function.Supplier;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.support.TransactionTemplate;

@Repository
public class AccessDirectory {
 public enum Permission { SIMULATOR, USERS, GROUPS }
 public record Capabilities(boolean canUseSimulator,boolean canManageUsers,boolean canManageGroups) {
  public boolean allows(Permission p){return switch(p){case SIMULATOR->canUseSimulator;case USERS->canManageUsers;case GROUPS->canManageGroups;};}
 }
 public record User(long id,String firstName,String lastName,String email,String principalKind,String systemKey) {}
 public record UserInput(String firstName,String lastName,String email) {}
 public record Group(long id,String name,List<String> permissions) {}
 public record GroupInput(String name,List<String> permissions) {}
 public record Members(List<User> users,List<Long> memberIds) {}
 public record MemberInput(List<Long> userIds) {}
 public static class Problem extends RuntimeException {
  public final int status;
  public Problem(int status,String message){super(message);this.status=status;}
 }
 private final DatabaseConnections connections;
 private final JdbcTemplate db;
 private final org.springframework.jdbc.datasource.AbstractDataSource source;
 private final TransactionTemplate transactions;
 private final boolean seedEveryone;
 private volatile boolean ready;
 public AccessDirectory(@Value("${simulation.database-url:}")String url,@Value("${access.seed-everyone-simulator:true}")boolean seedEveryone){
  connections=new DatabaseConnections(url);this.seedEveryone=seedEveryone;
  source=new AbstractDataSource(){public Connection getConnection()throws SQLException{return connections.open();}public Connection getConnection(String u,String p)throws SQLException{return getConnection();}};
  db=new JdbcTemplate(source);db.setQueryTimeout(15);transactions=new TransactionTemplate(new DataSourceTransactionManager(source));
 }
 @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
 public void prepare(){
  if(!connections.configured())return;
  var log=org.slf4j.LoggerFactory.getLogger(AccessDirectory.class);
  try{initialize();log.info("Demo Lab access schema ready.");}catch(Problem unavailable){log.warn("Demo Lab access schema unavailable; requests will fail closed.");}
 }
 public synchronized void initialize(){
  if(ready)return;
  try{
   String schema;try(var c=source.getConnection()){schema=c.getMetaData().getDatabaseProductName().equals("H2")?"DEMO_LAB":"demo_lab";}
   Flyway.configure().dataSource(source).schemas(schema).defaultSchema(schema).table("access_schema_history").locations("classpath:db/access-migration").load().migrate();
   transactions.execute(status->{
    boolean done=db.queryForObject("SELECT initialized FROM demo_lab.bootstrap_state WHERE id=1 FOR UPDATE",Boolean.class);
    if(!done){
     if(seedEveryone)db.update("INSERT INTO demo_lab.memberships SELECT p.group_id,u.id FROM demo_lab.group_permissions p CROSS JOIN demo_lab.users u WHERE p.permission='SIMULATOR' AND u.system_key='everyone'");
     db.update("UPDATE demo_lab.bootstrap_state SET initialized=TRUE WHERE id=1");
    }
    return null;
   });ready=true;
  }catch(Exception failure){throw new Problem(503,"Access storage is unavailable. Please retry.");}
 }
 private <T>T read(Supplier<T> operation){initialize();try{return operation.get();}catch(Problem p){throw p;}catch(org.springframework.dao.DataAccessException failure){throw new Problem(503,"Access storage is unavailable. Please retry.");}}
 private <T>T write(Supplier<T> operation){return read(()->{
  try{return transactions.execute(status->{
   db.queryForObject("SELECT initialized FROM demo_lab.bootstrap_state WHERE id=1 FOR UPDATE",Boolean.class);
   T result=operation.get();
   long admins=db.queryForObject("SELECT COUNT(*) FROM demo_lab.memberships m JOIN demo_lab.users u ON u.id=m.user_id JOIN demo_lab.group_permissions p ON p.group_id=m.group_id WHERE u.principal_kind='USER' AND p.permission='GROUPS'",Long.class);
   if(admins==0)throw new Problem(409,"Keep at least one named user with Groups administration access.");
   return result;
  });}catch(org.springframework.dao.DataIntegrityViolationException duplicate){throw new Problem(409,"That email or group name already exists, or a referenced record changed. Refresh and retry.");}
 });}
 public Capabilities capabilities(DemoSessions.Profile profile){return read(()->{
  String email=profile!=null&&"google".equals(profile.provider())&&profile.emailVerified()&&profile.email()!=null?profile.email().trim().toLowerCase(Locale.ROOT):null;
  var permissions=new HashSet<>(db.queryForList("SELECT DISTINCT p.permission FROM demo_lab.group_permissions p JOIN demo_lab.memberships m ON m.group_id=p.group_id JOIN demo_lab.users u ON u.id=m.user_id WHERE u.principal_kind='EVERYONE' OR (u.principal_kind='USER' AND u.email=?)",String.class,email));
  return new Capabilities(permissions.contains("SIMULATOR"),permissions.contains("USERS"),permissions.contains("GROUPS"));
 });}
 private User userRow(ResultSet r,int index)throws SQLException{return new User(r.getLong("id"),r.getString("first_name"),r.getString("last_name"),r.getString("email"),r.getString("principal_kind"),r.getString("system_key"));}
 public User getUser(long id){return read(()->user(id));}
 public List<User> users(){return read(()->db.query("SELECT * FROM demo_lab.users ORDER BY id",this::userRow));}
 private User user(long id){var rows=db.query("SELECT * FROM demo_lab.users WHERE id=?",this::userRow,id);if(rows.isEmpty())throw new Problem(404,"User not found.");return rows.get(0);}
 private String text(String s,int max){if(s==null||s.isBlank()||s.trim().length()>max)throw new Problem(400,"Complete the required fields within their length limits.");return s.trim();}
 private UserInput validated(UserInput input){
  if(input==null)throw new Problem(400,"User fields are required.");
  String email=text(input.email,254).toLowerCase(Locale.ROOT);
  if(!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))throw new Problem(400,"Enter a valid email address.");
  return new UserInput(text(input.firstName,80),text(input.lastName,80),email);
 }
 public User createUser(UserInput input){var v=validated(input);return write(()->{
  db.update("INSERT INTO demo_lab.users(first_name,last_name,email,principal_kind) VALUES (?,?,?,'USER')",v.firstName,v.lastName,v.email);
  return db.queryForObject("SELECT * FROM demo_lab.users WHERE email=?",this::userRow,v.email);
 });}
 public User updateUser(long id,UserInput input){var v=validated(input);return write(()->{
  var old=user(id);if("EVERYONE".equals(old.principalKind))throw new Problem(409,"Everyone is a reserved principal; edit its group memberships instead.");
  if("owner".equals(old.systemKey)&&!old.email.equals(v.email))throw new Problem(409,"The initial owner email is reserved.");
  db.update("UPDATE demo_lab.users SET first_name=?,last_name=?,email=? WHERE id=?",v.firstName,v.lastName,v.email,id);return user(id);
 });}
 public void deleteUser(long id){write(()->{var old=user(id);if(old.systemKey!=null)throw new Problem(409,"The initial owner and Everyone cannot be deleted.");db.update("DELETE FROM demo_lab.users WHERE id=?",id);return null;});}
 private Group group(long id){var rows=db.queryForList("SELECT name FROM demo_lab.groups WHERE id=?",String.class,id);if(rows.isEmpty())throw new Problem(404,"Group not found.");return new Group(id,rows.get(0),db.queryForList("SELECT permission FROM demo_lab.group_permissions WHERE group_id=? ORDER BY permission",String.class,id));}
 public Group getGroup(long id){return read(()->group(id));}
 public List<Group> groups(){return read(()->db.queryForList("SELECT id FROM demo_lab.groups ORDER BY id",Long.class).stream().map(this::group).toList());}
 private Set<String> permissions(GroupInput input){
  if(input==null||input.permissions==null||input.permissions.isEmpty())throw new Problem(400,"Choose at least one section permission.");
  var result=new LinkedHashSet<String>();for(String p:input.permissions){try{result.add(Permission.valueOf(p).name());}catch(Exception invalid){throw new Problem(400,"Unknown section permission.");}}
  if(result.size()!=input.permissions.size())throw new Problem(400,"Duplicate permission.");return result;
 }
 private void savePermissions(long id,Set<String> permissions){db.update("DELETE FROM demo_lab.group_permissions WHERE group_id=?",id);for(String p:permissions)db.update("INSERT INTO demo_lab.group_permissions(group_id,permission) VALUES (?,?)",id,p);}
 public Group createGroup(GroupInput input){var p=permissions(input);String name=text(input.name,120);return write(()->{
  db.update("INSERT INTO demo_lab.groups(name) VALUES (?)",name);long id=db.queryForObject("SELECT id FROM demo_lab.groups WHERE name=?",Long.class,name);savePermissions(id,p);return group(id);
 });}
 public Group updateGroup(long id,GroupInput input){var p=permissions(input);String name=text(input.name,120);return write(()->{group(id);db.update("UPDATE demo_lab.groups SET name=? WHERE id=?",name,id);savePermissions(id,p);return group(id);});}
 public void deleteGroup(long id){write(()->{group(id);db.update("DELETE FROM demo_lab.groups WHERE id=?",id);return null;});}
 public Members members(long id){return read(()->{group(id);return new Members(users(),db.queryForList("SELECT user_id FROM demo_lab.memberships WHERE group_id=? ORDER BY user_id",Long.class,id));});}
 public Members replaceMembers(long id,MemberInput input){
  if(input==null||input.userIds==null||input.userIds.stream().anyMatch(x->x==null||x<=0)||new HashSet<>(input.userIds).size()!=input.userIds.size())throw new Problem(400,"Choose distinct valid user IDs.");
  return write(()->{group(id);for(long userId:input.userIds)user(userId);db.update("DELETE FROM demo_lab.memberships WHERE group_id=?",id);for(long userId:input.userIds)db.update("INSERT INTO demo_lab.memberships(group_id,user_id) VALUES (?,?)",id,userId);return members(id);});
 }
}

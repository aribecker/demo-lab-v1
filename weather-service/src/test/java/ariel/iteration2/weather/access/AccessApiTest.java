package ariel.iteration2.weather.access;
import ariel.iteration2.weather.auth.DemoSessions;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"simulation.database-url=jdbc:h2:mem:access-api;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","simulation.scheduling-enabled=false"})
class AccessApiTest {
 @Autowired TestRestTemplate http;@Autowired DemoSessions sessions;@Autowired AccessDirectory directory;
 String token(String email){var p=new DemoSessions.Profile("google",email,email,email,null,null,null,true);String v="v".repeat(43);return sessions.exchange(sessions.issue(p,DemoSessions.digest(v)),v).token();}
 HttpHeaders headers(String token){var h=new HttpHeaders();h.setBearerAuth(token);return h;}
 @Test void anonymousSimulatorIsPublicButAdministrationIsProtected(){
  assertThat(http.getForEntity("/api/access/me",String.class).getBody()).contains("\"canUseSimulator\":true","\"canManageUsers\":false","\"canManageGroups\":false");
  assertThat(http.getForEntity("/api/simulation",String.class).getStatusCode().value()).isEqualTo(200);
  for(String path:List.of("users","groups","groups/1/members"))assertThat(http.getForEntity("/api/access/"+path,String.class).getStatusCode().value()).isEqualTo(401);
  assertThat(http.postForEntity("/api/access/users",Map.of("firstName","X","lastName","Y","email","x@y.test"),String.class).getStatusCode().value()).isEqualTo(401);
 }
 @Test void namedGrantRevocationAffectsAnExistingTokenAndCrudHasIndependentPermissions(){
  var owner=headers(token("aribecker2@gmail.com"));
  var user=directory.createUser(new AccessDirectory.UserInput("API","User","apiuser@example.test"));
  var group=directory.createGroup(new AccessDirectory.GroupInput("Only users API",List.of("USERS")));
  String token=token(user.email());var h=headers(token);
  assertThat(http.exchange("/api/access/users",HttpMethod.GET,new HttpEntity<>(h),String.class).getStatusCode().value()).isEqualTo(403);
  directory.replaceMembers(group.id(),new AccessDirectory.MemberInput(List.of(user.id())));
  assertThat(http.exchange("/api/access/users",HttpMethod.GET,new HttpEntity<>(h),String.class).getStatusCode().value()).isEqualTo(200);
  assertThat(http.exchange("/api/access/groups",HttpMethod.GET,new HttpEntity<>(h),String.class).getStatusCode().value()).isEqualTo(403);
  var created=http.exchange("/api/access/groups",HttpMethod.POST,new HttpEntity<>(new AccessDirectory.GroupInput("HTTP-created",List.of("SIMULATOR")),owner),AccessDirectory.Group.class);
  assertThat(created.getStatusCode().value()).isEqualTo(201);
  long id=created.getBody().id();
  assertThat(http.exchange("/api/access/groups/"+id,HttpMethod.PUT,new HttpEntity<>(new AccessDirectory.GroupInput("HTTP-updated",List.of("SIMULATOR")),owner),String.class).getStatusCode().value()).isEqualTo(200);
  assertThat(http.exchange("/api/access/groups/"+id,HttpMethod.DELETE,new HttpEntity<>(owner),String.class).getStatusCode().value()).isEqualTo(204);
  directory.replaceMembers(group.id(),new AccessDirectory.MemberInput(List.of()));
  assertThat(http.exchange("/api/access/users",HttpMethod.GET,new HttpEntity<>(h),String.class).getStatusCode().value()).isEqualTo(403);
 }
}

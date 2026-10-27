package ariel.iteration2.weather.treasury;

import ariel.iteration2.weather.auth.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties={"simulation.database-url=jdbc:h2:mem:treasury-bootstrap;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","auth.database-url=jdbc:h2:mem:treasury-bootstrap-auth;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","simulation.scheduling-enabled=false","treasury.bootstrap-owner-email=owner@example.invalid"})
@AutoConfigureMockMvc
class TreasuryOwnerBootstrapTest {
 @Autowired MockMvc mvc;
 @Autowired DemoSessions sessions;
 @Autowired TreasuryRepository repo;
 String token(String email,boolean verified){
  String verifier="z".repeat(43);
  var p=new DemoSessions.Profile("google",email,"Test",email,null,null,null,verified);
  return sessions.exchange(sessions.issue(p,DemoSessions.digest(verifier)),verifier).token();
 }
 @Test void verifiedConfiguredOwnerCanAccessExistingAndNewInstitutionsIdempotently()throws Exception{
  String existing=repo.saveInstitution(null,new TreasuryModels.Institution("Existing","OWN","generic",true));
  String token=token("owner@example.invalid",true);
  for(int n=0;n<2;n++)mvc.perform(get("/api/treasury/institutions/"+existing+"/members").header("Authorization","Bearer "+token)).andExpect(status().isOk());
  assertThat(repo.permitted(existing,"google","owner@example.invalid","can_confirm")).isTrue();
  mvc.perform(post("/api/treasury/institutions").header("Authorization","Bearer "+token).contentType("application/json").content("{\"name\":\"New\",\"code\":\"OWNNEW\",\"theme_id\":\"generic\",\"active\":true}")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions").header("Authorization","Bearer "+token)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(repo.institutions().size()));
  String added=(String)repo.institutions().stream().filter(i->"OWNNEW".equals(i.get("code"))).findFirst().orElseThrow().get("id");
  assertThat(repo.permitted(added,"google","owner@example.invalid","can_write")).isTrue();
 }
 @Test void unverifiedOrDifferentIdentityNeverReceivesGrants()throws Exception{
  String inst=repo.saveInstitution(null,new TreasuryModels.Institution("Secret","S"+java.util.UUID.randomUUID().toString().substring(0,8),"generic",true));
  for(String token:new String[]{token("owner@example.invalid",false),token("other@example.invalid",true)})mvc.perform(get("/api/treasury/institutions/"+inst+"/members").header("Authorization","Bearer "+token)).andExpect(status().isForbidden());
  assertThat(repo.permitted(inst,"google","other@example.invalid","can_read")).isFalse();
 }
}

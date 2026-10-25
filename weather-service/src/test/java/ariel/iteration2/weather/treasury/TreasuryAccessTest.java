package ariel.iteration2.weather.treasury;

import ariel.iteration2.weather.auth.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"simulation.database-url=jdbc:h2:mem:treasury-api;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","simulation.scheduling-enabled=false","auth.google.client-id=test-client","auth.google.client-secret=test-secret"})
@AutoConfigureMockMvc
class TreasuryAccessTest {
 @Autowired MockMvc mvc;
 @Autowired DemoSessions sessions;
 String token(String email,boolean verified){String v="v".repeat(43);var p=new DemoSessions.Profile("google","123","Ariel",email,null,null,null,verified);return sessions.exchange(sessions.issue(p,DemoSessions.digest(v)),v).token();}
 @Test void protectsReadsWritesAndAttachments()throws Exception {
  for(String path:new String[]{"/api/treasury/institutions","/api/treasury/institutions/x/entries/x/attachments/x","/api/treasury/institutions/x/balance?cutoff=2026-10-25"}){
   mvc.perform(get(path)).andExpect(status().isUnauthorized()).andExpect(content().encoding("UTF-8")).andExpect(jsonPath("$.message").value("Iniciá sesión con Google para acceder a la tesorería.")).andExpect(header().string("Cache-Control","no-store"));
   mvc.perform(get(path).header("Authorization","Bearer "+token("someone@gmail.com",true))).andExpect(status().isForbidden());
  }
  mvc.perform(post("/api/treasury/institutions").contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/treasury/institutions").header("Authorization","Bearer "+token("aribecker2@gmail.com",false))).andExpect(status().isForbidden());
  mvc.perform(get("/api/treasury/institutions").header("Authorization","Bearer "+token("aribecker2@gmail.com",true))).andExpect(status().isOk());
 }
 @Test void allowsOnlyConfiguredTreasuryOriginAndCallback()throws Exception {
  mvc.perform(options("/api/treasury/institutions").header("Origin","https://ariel-treasury.onrender.com").header("Access-Control-Request-Method","POST").header("Access-Control-Request-Headers","authorization,content-type"))
   .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","https://ariel-treasury.onrender.com"));
  mvc.perform(options("/api/treasury/institutions").header("Origin","https://evil.example").header("Access-Control-Request-Method","POST")).andExpect(status().isForbidden());
  var start=mvc.perform(get("/auth/start/google").param("app","treasury").param("challenge",DemoSessions.digest("a".repeat(43)))).andExpect(status().isFound()).andReturn();
  var session=(org.springframework.mock.web.MockHttpSession)start.getRequest().getSession(false);
  mvc.perform(get("/oauth2/authorization/google").session(session)).andExpect(status().isFound());
  mvc.perform(get("/login/oauth2/code/google").session(session).param("code","forged").param("state","wrong")).andExpect(redirectedUrl("https://ariel-treasury.onrender.com/login#auth_error=failed"));
 }
}

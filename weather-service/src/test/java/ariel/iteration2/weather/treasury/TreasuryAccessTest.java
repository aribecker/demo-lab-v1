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
 @Test void allowsTreasuryWithoutLoginButKeepsOtherFeaturesProtected()throws Exception {
  mvc.perform(get("/api/treasury/institutions")).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"));
  var created=mvc.perform(post("/api/treasury/institutions").contentType("application/json").content("{\"name\":\"Acceso directo\",\"code\":\"DIRECT\",\"theme_id\":\"generic\",\"active\":true}"))
   .andExpect(status().isOk()).andReturn();
  String id=new com.fasterxml.jackson.databind.ObjectMapper().readTree(created.getResponse().getContentAsString()).get("id").asText();
  mvc.perform(get("/api/treasury/institutions/"+id+"/members")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions/"+id+"/accounts")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions/"+id+"/entries")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions/"+id+"/balance").param("cutoff","2026-10-25")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions/"+id+"/journal").param("from","2026-10-01").param("to","2026-10-25")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions/"+id+"/entries/missing/attachments/missing")).andExpect(status().isNotFound());
  mvc.perform(get("/api/simulation")).andExpect(status().isUnauthorized());
  mvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
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

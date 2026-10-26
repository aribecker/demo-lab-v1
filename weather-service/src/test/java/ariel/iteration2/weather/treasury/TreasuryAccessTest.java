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
 @Test void backupPreviewNeedsNoInstitutionAndSendRequiresConfirmation()throws Exception {
  mvc.perform(get("/api/treasury/backup/preview")).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.recipient").value("aribecker2@gmail.com")).andExpect(jsonPath("$.configured").value(false)).andExpect(jsonPath("$.files.length()").value(2));
  mvc.perform(post("/api/treasury/backup/send").contentType("application/json").content("{\"confirmation\":\"forged\"}")).andExpect(status().isConflict());
 }
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
 @Test void memberAdmissionDateIsOptionalEditableAndValidated()throws Exception {
  var mapper=new com.fasterxml.jackson.databind.ObjectMapper();
  var result=mvc.perform(post("/api/treasury/institutions").contentType("application/json").content("{\"name\":\"Ingreso\",\"code\":\"DATES\",\"theme_id\":\"generic\",\"active\":true}")).andExpect(status().isOk()).andReturn();
  String inst=mapper.readTree(result.getResponse().getContentAsString()).get("id").asText(),path="/api/treasury/institutions/"+inst+"/members";
  var created=mvc.perform(post(path).contentType("application/json").content("{\"first_name\":\"Ana\",\"last_name\":\"Pérez\",\"active\":true}")).andExpect(status().isOk()).andReturn();
  String id=mapper.readTree(created.getResponse().getContentAsString()).get("id").asText();
  mvc.perform(get(path)).andExpect(jsonPath("$[0].admission_date").isEmpty());
  mvc.perform(post(path+"/"+id).contentType("application/json").content("{\"first_name\":\"Ana\",\"last_name\":\"Pérez\",\"active\":true,\"admission_date\":\"2020-01-02\"}")).andExpect(status().isOk());
  mvc.perform(get(path)).andExpect(jsonPath("$[0].admission_date").value("2020-01-02"));
  mvc.perform(post(path+"/"+id).contentType("application/json").content("{\"first_name\":\"Ana\",\"last_name\":\"Pérez\",\"active\":true,\"admission_date\":\"invalid\"}")).andExpect(status().isBadRequest());
  mvc.perform(post(path+"/"+id).contentType("application/json").content("{\"first_name\":\"Ana\",\"last_name\":\"Pérez\",\"active\":true,\"admission_date\":null}")).andExpect(status().isOk());
  mvc.perform(get(path)).andExpect(jsonPath("$[0].admission_date").isEmpty());
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


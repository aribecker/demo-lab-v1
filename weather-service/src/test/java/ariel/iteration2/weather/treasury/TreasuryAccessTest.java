package ariel.iteration2.weather.treasury;

import ariel.iteration2.weather.auth.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"simulation.database-url=jdbc:h2:mem:treasury-api;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","simulation.scheduling-enabled=false","access.seed-everyone-simulator=false","auth.google.client-id=test-client","auth.google.client-secret=test-secret","treasury.catalog-editors=owner@example.invalid"})
@AutoConfigureMockMvc
class TreasuryAccessTest {
 @Autowired MockMvc mvc;
 @Autowired DemoSessions sessions;
 @Autowired TreasuryRepository repo;
 @Autowired org.springframework.web.context.WebApplicationContext context;
 String token;
 @org.junit.jupiter.api.BeforeEach void authenticated(){
  var profile=new DemoSessions.Profile("google","treasury-user","Owner","owner@example.invalid",null,null,null,true);
  String verifier="v".repeat(43);token=sessions.exchange(sessions.issue(profile,DemoSessions.digest(verifier)),verifier).token();
  mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup(context)
    .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
    .defaultRequest(get("/").header("Authorization","Bearer "+token)).build();
 }
 void grant(String inst,boolean write,boolean confirm)throws Exception {
  repo.themes();try(var c=java.sql.DriverManager.getConnection("jdbc:h2:mem:treasury-api;MODE=PostgreSQL;DB_CLOSE_DELAY=-1");var st=c.prepareStatement("INSERT INTO treasury.treasury_permissions(institution_id,provider,account_id,can_read,can_write,can_confirm,granted_by) VALUES(?,'google','treasury-user',TRUE,?,?,'test-fixture')")){
   st.setString(1,inst);st.setBoolean(2,write);st.setBoolean(3,confirm);st.executeUpdate();
  }
 }
 @Test void rejectsAnonymousWritesReadsAndGlobalBackups()throws Exception {
  mvc.perform(post("/api/treasury/institutions").header("Authorization","").contentType("application/json").content("{}" )).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/treasury/institutions").header("Authorization","")).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/treasury/backup/preview").header("Authorization","")).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/treasury/themes").header("Authorization","")).andExpect(status().isOk());
 }
 @Test void loginDoesNotGrantInstitutionAccessAndReadDoesNotGrantWrite()throws Exception {
  String inst=repo.saveInstitution(null,new TreasuryModels.Institution("Private","P"+java.util.UUID.randomUUID().toString().substring(0,8),"generic",true));
  String path="/api/treasury/institutions/"+inst;
  mvc.perform(get(path+"/members")).andExpect(status().isForbidden());
  grant(inst,false,false);
  mvc.perform(get(path+"/members")).andExpect(status().isOk());
  mvc.perform(post(path+"/members").contentType("application/json").content("{}" )).andExpect(status().isForbidden());
  mvc.perform(post(path+"/entries/missing/post").contentType("application/json").content("{}" )).andExpect(status().isForbidden());
 }
 @Test void writePermissionDoesNotGrantPostingOrAnotherInstitution()throws Exception {
  String inst=repo.saveInstitution(null,new TreasuryModels.Institution("Writer","W"+java.util.UUID.randomUUID().toString().substring(0,8),"generic",true));grant(inst,true,false);
  String path="/api/treasury/institutions/"+inst;
  mvc.perform(post(path+"/suppliers").contentType("application/json").content("{\"name\":\"Supplier\",\"active\":true}" )).andExpect(status().isOk());
  mvc.perform(post(path+"/entries/missing/reverse").contentType("application/json").content("{}" )).andExpect(status().isForbidden());
  mvc.perform(get("/api/treasury/institutions/another/members")).andExpect(status().isForbidden());
 }
 @Test void backupPreviewNeedsNoInstitutionAndSendRequiresConfirmation()throws Exception {
  mvc.perform(get("/api/treasury/backup/preview")).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.recipient").value("aribecker2@gmail.com")).andExpect(jsonPath("$.configured").value(false)).andExpect(jsonPath("$.files.length()").value(2));
  mvc.perform(post("/api/treasury/backup/send").contentType("application/json").content("{\"confirmation\":\"forged\"}")).andExpect(status().isConflict());
 }
 @Test void allowsGrantedTreasurySessionButKeepsOtherFeaturesProtected()throws Exception {
  mvc.perform(get("/api/treasury/institutions")).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"));
  var created=mvc.perform(post("/api/treasury/institutions").contentType("application/json").content("{\"name\":\"Acceso directo\",\"code\":\"DIRECT\",\"theme_id\":\"generic\",\"active\":true}"))
   .andExpect(status().isOk()).andReturn();
  String id=new com.fasterxml.jackson.databind.ObjectMapper().readTree(created.getResponse().getContentAsString()).get("id").asText();grant(id,true,true);
  mvc.perform(get("/api/treasury/institutions/"+id+"/members")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions/"+id+"/accounts")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions/"+id+"/entries")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions/"+id+"/balance").param("cutoff","2026-10-25")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions/"+id+"/journal").param("from","2026-10-01").param("to","2026-10-25")).andExpect(status().isOk());
  mvc.perform(get("/api/treasury/institutions/"+id+"/entries/missing/attachments/missing")).andExpect(status().isNotFound());
  mvc.perform(get("/api/simulation")).andExpect(status().isForbidden());
  mvc.perform(get("/api/simulation").header("Authorization","")).andExpect(status().isUnauthorized());
  mvc.perform(get("/auth/me").header("Authorization","")).andExpect(status().isUnauthorized());
 }
 @Test void memberAdmissionDateIsOptionalEditableAndValidated()throws Exception {
  var mapper=new com.fasterxml.jackson.databind.ObjectMapper();
  var result=mvc.perform(post("/api/treasury/institutions").contentType("application/json").content("{\"name\":\"Ingreso\",\"code\":\"DATES\",\"theme_id\":\"generic\",\"active\":true}")).andExpect(status().isOk()).andReturn();
  String inst=mapper.readTree(result.getResponse().getContentAsString()).get("id").asText(),path="/api/treasury/institutions/"+inst+"/members";grant(inst,true,true);
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



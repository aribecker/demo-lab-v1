package ariel.iteration2.weather.auth;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest(properties={"auth.database-url=jdbc:h2:mem:oauth-sessions;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","auth.google.client-id=test-client","auth.google.client-secret=test-secret","auth.backend-url=https://api.example.test","auth.frontend-url=https://app.example.test"})
@AutoConfigureMockMvc
class OAuthBoundaryTest {
 @Autowired MockMvc mvc;
 @Autowired DemoSessions store;
 @Test void startsOnlyWithValidChallengeAndUsesStateAndPkce()throws Exception{
  mvc.perform(get("/auth/start/google").param("challenge","invalid")).andExpect(status().isBadRequest());
  var start=mvc.perform(get("/auth/start/google").param("challenge",DemoSessions.digest("a".repeat(43))))
      .andExpect(status().isFound()).andExpect(redirectedUrl("/oauth2/authorization/google")).andReturn();
  var session=(MockHttpSession)start.getRequest().getSession(false);
  var authorization=mvc.perform(get("/oauth2/authorization/google").session(session)).andExpect(status().isFound()).andReturn();
  assertThat(authorization.getResponse().getRedirectedUrl()).contains("accounts.google.com","state=","code_challenge=","code_challenge_method=S256").doesNotContain("test-secret");
  mvc.perform(get("/login/oauth2/code/google").session(session).param("code","forged").param("state","wrong"))
    .andExpect(status().isFound()).andExpect(redirectedUrl("https://app.example.test/login#auth_error=failed"));
 }
 @Test void bearerSessionRestoresAndRevokesWithoutCookieAuth()throws Exception{
  var p=new DemoSessions.Profile("github","42","Ariel",null,null,null,null);
  var result=store.exchange(store.issue(p,DemoSessions.digest("a".repeat(43))),"a".repeat(43));
  mvc.perform(get("/auth/me").header("Authorization","Bearer "+result.token())).andExpect(status().isOk()).andExpect(jsonPath("$.profile.name").value("Ariel"));
  mvc.perform(post("/auth/logout").header("Authorization","Bearer "+result.token())).andExpect(status().isNoContent());
  mvc.perform(get("/auth/me").header("Authorization","Bearer "+result.token())).andExpect(status().isUnauthorized());
 }
}


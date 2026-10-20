package ariel.iteration2.weather.auth;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthApiTest {
 @Autowired TestRestTemplate http;
 @Test void noSecretsStillStartsAndListsAllProviders(){
  var r=http.getForEntity("/auth/providers",String.class);
  assertThat(r.getStatusCode().value()).isEqualTo(200);
  assertThat(r.getHeaders().getCacheControl()).contains("no-store");
  assertThat(r.getBody()).contains("Google","GitHub","Microsoft").doesNotContain("true","client-secret");
 }
 @Test void rejectsForgedExchangeAndUnauthenticatedProfile(){
  assertThat(http.postForEntity("/auth/exchange",Map.of("ticket","x".repeat(43),"verifier","y".repeat(43)),String.class).getStatusCode().value()).isEqualTo(400);
  assertThat(http.getForEntity("/auth/me",String.class).getStatusCode().value()).isEqualTo(401);
  assertThat(http.getForEntity("/auth/start/unknown?challenge="+"x".repeat(43),String.class).getStatusCode().value()).isEqualTo(503);
 }
 @Test void exactOriginCorsAcceptsBearerAndRejectsForeignOrigin(){
  var h=new HttpHeaders();h.setOrigin("http://localhost:5173");h.setAccessControlRequestMethod(HttpMethod.POST);h.setAccessControlRequestHeaders(java.util.List.of("authorization","content-type"));
  var r=http.exchange("/auth/exchange",HttpMethod.OPTIONS,new HttpEntity<>(h),String.class);
  assertThat(r.getStatusCode().value()).isEqualTo(200);assertThat(r.getHeaders().getAccessControlAllowOrigin()).isEqualTo("http://localhost:5173");
  h.setOrigin("https://attacker.test");assertThat(http.exchange("/auth/exchange",HttpMethod.OPTIONS,new HttpEntity<>(h),String.class).getStatusCode().value()).isEqualTo(403);
 }
}

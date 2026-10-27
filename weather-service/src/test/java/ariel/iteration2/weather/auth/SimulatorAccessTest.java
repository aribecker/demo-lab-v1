package ariel.iteration2.weather.auth;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.*;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import ariel.iteration2.weather.simulation.SimulationStore;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={
 "simulation.database-url=jdbc:h2:mem:owner-access;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","simulation.scheduling-enabled=false","access.seed-everyone-simulator=false"})
class SimulatorAccessTest {
 @Autowired TestRestTemplate http;
 @Autowired DemoSessions sessions;
 @Autowired SimulationStore store;
 DemoSessions.Profile profile(String provider,String email,boolean verified) {
  return new DemoSessions.Profile(provider,"123","Ariel Becker",email,null,null,null,verified);
 }
 String token(DemoSessions.Profile p) {String verifier="v".repeat(43);return sessions.exchange(sessions.issue(p,DemoSessions.digest(verifier)),verifier).token();}
 HttpHeaders headers(String token) {var h=new HttpHeaders();if(token!=null)h.setBearerAuth(token);return h;}
 ResponseEntity<String> get(String path,String token) {return http.exchange(path,HttpMethod.GET,new HttpEntity<>(headers(token)),String.class);}
 @Test void rejectsAllAnonymousAndForgedAccessBeforeStorageOrCommandProcessing() {
  long revision=store.read().controlRevision;
  for(String token:new String[]{null,"x".repeat(43)}) {
   for(String path:new String[]{"/api/simulation","/api/simulation/rate-queries","/api/simulation/rate-periods","/api/database/rows?schema=bitcoin_shared&table=simulation_state"}) {
    var r=get(path,token);assertThat(r.getStatusCode().value()).isEqualTo(401);assertThat(r.getHeaders().getCacheControl()).contains("no-store");
   }
   var r=http.exchange("/api/simulation/commands",HttpMethod.POST,new HttpEntity<>(Map.of("type","reset"),headers(token)),String.class);
   assertThat(r.getStatusCode().value()).isEqualTo(401);
  }
  assertThat(store.read().controlRevision).isEqualTo(revision);
 }
 @Test void onlyVerifiedExactGoogleOwnerMayReadOrCommand() {
  long revision=store.read().controlRevision;
  for(var p:new DemoSessions.Profile[]{profile("google","someone@gmail.com",true),profile("google","aribecker2@gmail.com",false),profile("github","aribecker2@gmail.com",true),profile("google","aribecker2+other@gmail.com",true),profile("google",null,true)}) {
   String token=token(p);
   for(String path:new String[]{"/api/simulation","/api/simulation/rate-queries","/api/simulation/rate-periods","/api/database/rows?schema=bitcoin_shared&table=simulation_state"})assertThat(get(path,token).getStatusCode().value()).isEqualTo(403);
   assertThat(http.exchange("/api/simulation/commands",HttpMethod.POST,new HttpEntity<>(Map.of("type","reset"),headers(token)),String.class).getStatusCode().value()).isEqualTo(403);
   assertThat(get("/auth/me",token).getBody()).contains("\"canUseSimulator\":false");
  }
  assertThat(store.read().controlRevision).isEqualTo(revision);
  String owner=token(profile("google","ARIBECKER2@gmail.com",true));
  assertThat(get("/auth/me",owner).getBody()).contains("\"canUseSimulator\":true");
  assertThat(get("/api/simulation",owner).getStatusCode().value()).isEqualTo(200);
  assertThat(get("/api/simulation/rate-queries",owner).getStatusCode().value()).isEqualTo(200);
  assertThat(get("/api/simulation/rate-periods",owner).getStatusCode().value()).isEqualTo(200);
  var command=Map.of("id",java.util.UUID.randomUUID().toString(),"expectedControlRevision",revision,"type","running","running",false);
  assertThat(http.exchange("/api/simulation/commands",HttpMethod.POST,new HttpEntity<>(command,headers(owner)),String.class).getStatusCode().value()).isEqualTo(200);
  assertThat(store.read().controlRevision).isEqualTo(revision+1);
  sessions.revoke(owner);assertThat(get("/api/simulation",owner).getStatusCode().value()).isEqualTo(401);
 }
 @Test void expiredSessionCannotBeUsedAndVerifiedClaimIsStrict() {
  var fixed=Clock.fixed(Instant.parse("2026-10-25T00:00:00Z"),ZoneOffset.UTC);
  class Moving extends Clock {Instant now=fixed.instant();public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId z){return this;}public Instant instant(){return now;}}
  var clock=new Moving();var store=SessionFixtures.sessions(clock);String v="a".repeat(43);
  var result=store.exchange(store.issue(profile("google","aribecker2@gmail.com",true),DemoSessions.digest(v)),v);
  assertThat(result.canUseSimulator()).isTrue();clock.now=clock.now.plusSeconds(DemoSessions.LIFETIME_SECONDS+1);assertThat(store.find(result.token())).isNull();
  var directory=new ariel.iteration2.weather.access.AccessDirectory("jdbc:h2:mem:identity-claims;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",false);
  assertThat(directory.capabilities(Profiles.from("google",Map.of("email","aribecker2@gmail.com","email_verified",true))).canUseSimulator()).isTrue();
  assertThat(directory.capabilities(Profiles.from("google",Map.of("email","aribecker2@gmail.com","email_verified","true"))).canUseSimulator()).isFalse();
  assertThat(directory.capabilities(Profiles.from("google",Map.of("email","aribecker2@gmail.com"))).canUseSimulator()).isFalse();
 }
 @Test void publicMarketIsReadOnlyAndNeverLeaksSimulation() {
  long revision=store.read().controlRevision,count=store.history().summary().total();
  var r=http.getForEntity("/api/bitcoin",JsonNode.class);
  assertThat(r.getStatusCode().value()).isEqualTo(200);assertThat(r.getHeaders().getCacheControl()).contains("no-store");
  assertThat(r.getBody().has("samples")).isTrue();assertThat(r.getBody().has("rateQueries")).isTrue();
  for(String key:new String[]{"simulation","settings","controlRevision","runMetrics","trades","usdt","btc"})assertThat(r.getBody().has(key)).isFalse();
  assertThat(get("/api/bitcoin/rate-queries",null).getStatusCode().value()).isEqualTo(200);
  assertThat(get("/api/bitcoin/rate-periods",null).getStatusCode().value()).isEqualTo(200);
  assertThat(http.postForEntity("/api/bitcoin/commands",Map.of("type","reset"),String.class).getStatusCode().value()).isIn(404,405);
  assertThat(store.read().controlRevision).isEqualTo(revision);assertThat(store.history().summary().total()).isEqualTo(count);
 }
 @Test void corsPreflightStillWorksForOwnerBearerRequests() {
  var h=headers(null);h.setOrigin("http://localhost:5173");h.setAccessControlRequestMethod(HttpMethod.POST);h.setAccessControlRequestHeaders(java.util.List.of("authorization","content-type"));
  var r=http.exchange("/api/simulation/commands",HttpMethod.OPTIONS,new HttpEntity<>(h),String.class);
  assertThat(r.getStatusCode().value()).isEqualTo(200);assertThat(r.getHeaders().getAccessControlAllowOrigin()).isEqualTo("http://localhost:5173");
 }
}

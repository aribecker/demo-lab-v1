package ariel.iteration2.weather.auth;
import java.time.*;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class DemoSessionsTest {
    static final String VERIFIER="a".repeat(43);
    final DemoSessions.Profile profile=new DemoSessions.Profile("google","123","Ariel","ariel@example.test",null,null,null);
    @Test void exchangeIsBoundAndSingleUseAndLogoutRevokes(){
        var store=new DemoSessions(Clock.systemUTC());
        String ticket=store.issue(profile,DemoSessions.digest(VERIFIER));
        assertThatThrownBy(()->store.exchange(ticket,"b".repeat(43))).isInstanceOf(IllegalArgumentException.class);
        var result=store.exchange(ticket,VERIFIER);
        assertThat(result.profile()).isEqualTo(profile);assertThat(store.find(result.token())).isNotNull();
        assertThatThrownBy(()->store.exchange(ticket,VERIFIER)).isInstanceOf(IllegalArgumentException.class);
        store.revoke(result.token());assertThat(store.find(result.token())).isNull();
        assertThat(store.find("forged")).isNull();
    }
    static class MutableClock extends Clock {
        Instant now=Instant.parse("2026-10-20T00:00:00Z");
        public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId z){return this;}public Instant instant(){return now;}
    }
    @Test void expiresTicketsAndSessions(){
        var clock=new MutableClock();var store=new DemoSessions(clock);
        String expired=store.issue(profile,DemoSessions.digest(VERIFIER));clock.now=clock.now.plusSeconds(60);
        assertThatThrownBy(()->store.exchange(expired,VERIFIER)).isInstanceOf(IllegalArgumentException.class);
        var result=store.exchange(store.issue(profile,DemoSessions.digest(VERIFIER)),VERIFIER);
        clock.now=clock.now.plusSeconds(1800);assertThat(store.find(result.token())).isNull();
    }
    @Test void validatesInputAndBoundsTicketMemory(){
        var store=new DemoSessions(Clock.systemUTC());
        assertThatThrownBy(()->store.issue(profile,"bad")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->store.exchange(null,null)).isInstanceOf(IllegalArgumentException.class);
        for(int i=0;i<1000;i++)store.issue(profile,DemoSessions.digest(VERIFIER));
        assertThatThrownBy(()->store.issue(profile,DemoSessions.digest(VERIFIER))).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void normalizesThreeProvidersWithoutInventingMissingFields(){
        assertThat(Profiles.from("google",Map.of("sub","1","name","Ariel","email","a@example.test")).name()).isEqualTo("Ariel");
        assertThat(Profiles.from("github",Map.of("id",42,"login","aribecker")).email()).isNull();
        assertThat(Profiles.from("microsoft",Map.of("id","2","displayName","Ariel","userPrincipalName","a@example.test")).email()).isEqualTo("a@example.test");
        assertThat(Profiles.from("google",Map.of("picture","javascript:alert(1)")).picture()).isNull();
    }
}

package ariel.iteration2.weather.auth;
import java.time.Clock;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;
public final class SessionFixtures {
 public static DemoSessions sessions(Clock clock) {
  return new DemoSessions(clock,new AuthSessionStore("jdbc:h2:mem:auth-"+UUID.randomUUID()+";MODE=PostgreSQL;DB_CLOSE_DELAY=-1",new ObjectMapper()));
 }
}

package ariel.sdd.weather;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
@RestController
public class ApiController {
 private final WeatherGateway gateway;
 public ApiController(WeatherGateway gateway) { this.gateway=gateway; }
 @GetMapping("/api/hello") public CompletableFuture<Greeting> hello() {
  return gateway.fetch().thenApply(w -> new Greeting("Hello World · Version "+WeatherApplication.VERSION,
   WeatherApplication.VERSION,w,Instant.now().toString(),"Browser → Spring Boot API → Weather microservice → "+w.source()+" → JSON → Browser"));
 }
 @GetMapping("/health") public String health() { return "ok"; }
}

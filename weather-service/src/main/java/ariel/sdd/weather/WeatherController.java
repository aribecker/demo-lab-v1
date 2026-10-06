package ariel.sdd.weather;
import org.springframework.web.bind.annotation.*;
import java.util.concurrent.CompletableFuture;
@RestController
public class WeatherController {
 private final WeatherService service;
 public WeatherController(WeatherService service) { this.service = service; }
 @GetMapping("/api/weather") public CompletableFuture<WeatherData> weather() { return service.weather(); }
 @GetMapping("/health") public String health() { return "ok"; }
}

package ariel.sdd.weather;
import org.springframework.web.bind.annotation.*;
import java.util.concurrent.CompletableFuture;
@RestController
public class ProviderController {
 private final ProviderClient provider;
 public ProviderController(ProviderClient provider) { this.provider=provider; }
 @GetMapping("/api/weather") public CompletableFuture<WeatherData> weather(jakarta.servlet.http.HttpServletRequest request) { return provider.fetch((String)request.getAttribute("weather.trace")); }
 @GetMapping("/health") public String health() { return "ok"; }
}

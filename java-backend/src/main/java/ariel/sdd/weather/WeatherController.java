package ariel.sdd.weather;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;

@RestController
public class WeatherController {
 private final WeatherService service;

 public WeatherController(WeatherService service) {
  this.service = service;
 }

 @GetMapping(value = "/api/hello", produces = MediaType.APPLICATION_JSON_VALUE)
 public CompletableFuture<WeatherResponse> hello() {
  return service.weather().thenApply(weather -> new WeatherResponse(
      "Hello World · Version " + WeatherApplication.APP_VERSION,
      WeatherApplication.APP_VERSION, weather, Instant.now().toString(),
      "Browser → Spring Boot REST API → " + weather.source() + " → JSON → Browser"));
 }

 @GetMapping(value = "/health", produces = MediaType.TEXT_PLAIN_VALUE)
 public String health() {
  return "ok";
 }
}

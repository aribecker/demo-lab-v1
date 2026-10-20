package ariel.iteration2.weather;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class WeatherController {
    private final WeatherService weather;

    WeatherController(WeatherService weather) { this.weather = weather; }

    @GetMapping("/api/weather")
    WeatherReading weather(HttpServletRequest request) {
        return weather.read((String) request.getAttribute(RequestLogFilter.REQUEST_ID));
    }

    @GetMapping("/health")
    Map<String, String> health() { return Map.of("status", "UP", "version", "2.0.0"); }

    @ExceptionHandler(WeatherService.ProvidersUnavailable.class)
    ResponseEntity<Map<String, Object>> unavailable(WeatherService.ProvidersUnavailable failure,
                                                   HttpServletRequest request) {
        return ResponseEntity.status(failure.timedOut ? 504 : 502).body(Map.of(
                "code", "PROVIDER_UNAVAILABLE",
                "message", "Weather providers are unavailable. Please try again.",
                "requestId", request.getAttribute(RequestLogFilter.REQUEST_ID), "retryable", false));
    }
}

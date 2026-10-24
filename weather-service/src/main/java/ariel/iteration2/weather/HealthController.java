package ariel.iteration2.weather;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class HealthController {
    @GetMapping("/health")
    Map<String,String> health() { return Map.of("status", "UP", "version", "2.9.0"); }
}

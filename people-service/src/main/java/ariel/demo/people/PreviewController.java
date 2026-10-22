package ariel.demo.people;
import java.util.Map;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Explicit provisioning state: never substitutes fake or in-memory records. */
@Profile("!database")
@RestController
class PreviewController {
    @GetMapping("/health") Map<String, Object> health() {
        return Map.of("status", "UP", "service", "people-service", "databaseConfigured", false);
    }
    @RequestMapping(value = "/api/people", method = {RequestMethod.GET, RequestMethod.POST})
    ResponseEntity<?> pending() {
        return ResponseEntity.status(503).body(Map.of("message", "The PostgreSQL connection is pending configuration. No records have been saved."));
    }
}

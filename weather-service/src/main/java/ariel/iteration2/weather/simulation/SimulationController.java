package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {
    private final SimulationService service;
    private final ObjectMapper json;
    public SimulationController(SimulationService service, ObjectMapper json) { this.service=service; this.json=json; }
    @GetMapping public ResponseEntity<JsonNode> state() { return ok(service.read()); }
    @PostMapping("/commands") public ResponseEntity<JsonNode> command(@RequestBody JsonNode command) { return ok(service.command(command)); }
    private ResponseEntity<JsonNode> ok(SharedState state) {
        ObjectNode snapshot = json.valueToTree(state);
        snapshot.set("execution", json.valueToTree(service.execution()));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(snapshot);
    }
    @ExceptionHandler(SimulationStore.StorageUnavailable.class)
    ResponseEntity<?> unavailable() { return ResponseEntity.status(503).cacheControl(CacheControl.noStore())
        .body(Map.of("code","SIMULATION_STORAGE_UNAVAILABLE","message","Shared simulation storage is not configured or unavailable. No local simulation was created.")); }
    @ExceptionHandler(SimulationService.Conflict.class)
    ResponseEntity<?> conflict(SimulationService.Conflict error) { return ResponseEntity.status(409).cacheControl(CacheControl.noStore())
        .body(Map.of("code","SIMULATION_CONFLICT","message",error.getMessage())); }
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> invalid(IllegalArgumentException error) { return ResponseEntity.badRequest().cacheControl(CacheControl.noStore())
        .body(Map.of("code","INVALID_SIMULATION_COMMAND","message",error.getMessage())); }
}


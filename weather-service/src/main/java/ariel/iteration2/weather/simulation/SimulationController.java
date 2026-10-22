package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {
    private final SimulationService service;
    public SimulationController(SimulationService service) { this.service=service; }
    @GetMapping public ResponseEntity<SharedState> state() { return ok(service.read()); }
    @PostMapping("/commands") public ResponseEntity<SharedState> command(@RequestBody JsonNode command) { return ok(service.command(command)); }
    private ResponseEntity<SharedState> ok(SharedState state) { return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(state); }
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

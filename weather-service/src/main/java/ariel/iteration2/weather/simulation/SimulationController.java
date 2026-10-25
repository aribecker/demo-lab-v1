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
    @GetMapping("/rate-queries") public ResponseEntity<RateQueryHistory.Page> rateQueries(@RequestParam(required=false) Long before,@RequestParam(defaultValue="25") int limit) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.rateQueries(before,limit));
    }
    @PostMapping("/commands") public ResponseEntity<JsonNode> command(@RequestBody JsonNode command) { return ok(service.command(command)); }
    private ResponseEntity<JsonNode> ok(SharedState state) {
        ObjectNode snapshot = json.valueToTree(state);
        snapshot.set("rateQueries", json.valueToTree(service.rateSummary()));
        snapshot.set("execution", json.valueToTree(service.execution()));
        snapshot.set("runMetrics", json.valueToTree(service.runMetrics(state)));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(snapshot);
    }
    @ExceptionHandler(SimulationStore.StorageUnavailable.class)
    ResponseEntity<?> unavailable() { return ResponseEntity.status(503).cacheControl(CacheControl.noStore())
        .body(Map.of("code","SIMULATION_STORAGE_UNAVAILABLE","message","Shared simulation storage is not configured or unavailable. No local simulation was created.")); }
    @ExceptionHandler(SimulationService.Conflict.class)
    ResponseEntity<?> conflict(SimulationService.Conflict error) { return ResponseEntity.status(409).cacheControl(CacheControl.noStore())
        .body(Map.of("code","SIMULATION_CONFLICT","message",error.getMessage())); }
    @ExceptionHandler({IllegalArgumentException.class,org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    ResponseEntity<?> invalid(Exception error) { return ResponseEntity.badRequest().cacheControl(CacheControl.noStore())
        .body(Map.of("code","INVALID_SIMULATION_COMMAND","message","Use valid simulation settings, a positive history cursor and a page size from 1 to 100.")); }
}


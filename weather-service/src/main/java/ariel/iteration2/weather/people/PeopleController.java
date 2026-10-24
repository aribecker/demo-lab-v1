package ariel.iteration2.weather.people;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;
import org.springframework.dao.DataAccessException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestController
@RequestMapping("/api/people")
public class PeopleController {
    private final PeopleRepository repository;
    public PeopleController(PeopleRepository repository) { this.repository=repository; }
    @GetMapping public PeopleRepository.Page list(@RequestParam(required=false) Long before, @RequestParam(defaultValue="50") int limit) {
        if (limit < 1 || limit > 100 || before != null && before < 1) throw new IllegalArgumentException();
        return repository.list(before, limit);
    }
    @PostMapping public ResponseEntity<PeopleRepository.Person> add(@RequestBody JsonNode body) {
        if (body == null || !body.path("name").isTextual() || !body.path("requestId").isTextual()) throw new IllegalArgumentException();
        String name=body.path("name").asText().strip();
        if (name.isBlank() || name.length()>100) throw new IllegalArgumentException();
        String raw=body.path("requestId").asText(); UUID id=UUID.fromString(raw);
        if (!id.toString().equalsIgnoreCase(raw)) throw new IllegalArgumentException();
        var saved=repository.add(name,id);
        return ResponseEntity.status(saved.created()?201:200).cacheControl(CacheControl.noStore()).body(saved.person());
    }
    @GetMapping("/health") public Map<String,String> health() {
        repository.health(); return Map.of("status","UP","database","PostgreSQL");
    }
    @ExceptionHandler(PeopleRepository.Conflict.class) ResponseEntity<?> conflict() {
        return error(409,"This request ID was already used with another name.");
    }
    @ExceptionHandler({PeopleRepository.Unavailable.class,DataAccessException.class}) ResponseEntity<?> unavailable() {
        return error(503,"The PostgreSQL people list is unavailable. Please retry; no local replacement was created.");
    }
    @ExceptionHandler({IllegalArgumentException.class,HttpMessageNotReadableException.class,MethodArgumentTypeMismatchException.class}) ResponseEntity<?> invalid() {
        return error(400,"Use a nonblank name of at most 100 characters, a valid request UUID and valid pagination.");
    }
    private ResponseEntity<?> error(int status,String message) {
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore()).body(Map.of("message",message));
    }
}

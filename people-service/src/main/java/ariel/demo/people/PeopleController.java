package ariel.demo.people;
import org.springframework.context.annotation.Profile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@Profile("database")
class PeopleController {
    record CreatePerson(@NotBlank @Size(max = 100) String name, @NotNull UUID requestId) {
        CreatePerson { if (name != null) name = name.strip(); }
    }
    private final PeopleRepository repository;
    private final JdbcTemplate jdbc;
    PeopleController(PeopleRepository repository, JdbcTemplate jdbc) { this.repository = repository; this.jdbc = jdbc; }
    @GetMapping("/api/people")
    PeopleRepository.Page list(@RequestParam(required = false) Long before, @RequestParam(defaultValue = "50") int limit) {
        if (limit < 1 || limit > 100 || before != null && before < 1) throw new IllegalArgumentException();
        return repository.list(before, limit);
    }
    @PostMapping("/api/people")
    ResponseEntity<PeopleRepository.Person> add(@Valid @RequestBody CreatePerson request) {
        var saved = repository.add(request.name(), request.requestId());
        return ResponseEntity.status(saved.created() ? 201 : 200).body(saved.person());
    }
    @GetMapping("/health")
    Map<String, String> health() {
        jdbc.queryForObject("SELECT 1", Integer.class);
        return Map.of("status", "UP", "service", "people-service", "database", "PostgreSQL");
    }
}

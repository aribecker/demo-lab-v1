package ariel.iteration2.weather.database;

import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestController
@RequestMapping("/api/database")
public class DatabaseExplorerController {
    private final DatabaseExplorerRepository repository;
    public DatabaseExplorerController(DatabaseExplorerRepository repository) { this.repository=repository; }
    @GetMapping public DatabaseExplorerRepository.Catalog catalog() { return repository.catalog(); }
    @GetMapping("/rows") public DatabaseExplorerRepository.Page rows(@RequestParam String schema,@RequestParam String table,
        @RequestParam(defaultValue="0") long offset,@RequestParam(defaultValue="25") int limit) {
        return repository.rows(schema,table,offset,limit);
    }
    @ExceptionHandler(DatabaseExplorerRepository.Unavailable.class) ResponseEntity<?> unavailable() {
        return error(503,"The database explorer is unavailable. Please retry when PostgreSQL is connected.");
    }
    @ExceptionHandler(DatabaseExplorerRepository.NotFound.class) ResponseEntity<?> missing() {
        return error(404,"This accessible database table was not found. Refresh the table list.");
    }
    @ExceptionHandler({IllegalArgumentException.class,MethodArgumentTypeMismatchException.class}) ResponseEntity<?> invalid() {
        return error(400,"Choose a table, an offset from 0 to 1000000 and a page size from 1 to 50.");
    }
    private ResponseEntity<?> error(int status,String message) {
        return ResponseEntity.status(status).body(Map.of("message",message));
    }
}

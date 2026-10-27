package ariel.iteration2.weather.access;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
public class AccessErrors {
 @ExceptionHandler(AccessDirectory.Problem.class) public ResponseEntity<?> problem(AccessDirectory.Problem p){return ResponseEntity.status(p.status).cacheControl(CacheControl.noStore()).body(Map.of("message",p.getMessage()));}
}

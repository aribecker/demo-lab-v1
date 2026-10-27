package ariel.iteration2.weather.auth;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
public class AuthStorageErrors {
    @ExceptionHandler(AuthSessionStore.Unavailable.class)
    public ResponseEntity<?> unavailable() {
        return ResponseEntity.status(503).cacheControl(CacheControl.noStore()).body(Map.of("error","auth_storage_unavailable","message","Login storage is temporarily unavailable. Please retry."));
    }
}

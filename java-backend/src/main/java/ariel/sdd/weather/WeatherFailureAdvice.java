package ariel.sdd.weather;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.concurrent.*;
import java.net.http.HttpTimeoutException;
@RestControllerAdvice
public class WeatherFailureAdvice {
 @ExceptionHandler({CompletionException.class, ExecutionException.class, java.io.IOException.class, TimeoutException.class, RuntimeException.class})
 public ResponseEntity<Map<String,String>> failure(Exception exception) {
  Throwable cause = exception;
  while ((cause instanceof CompletionException || cause instanceof ExecutionException) && cause.getCause()!=null) cause=cause.getCause();
  int status = cause instanceof TimeoutException || cause instanceof HttpTimeoutException ? 504 : 502;
  return ResponseEntity.status(status).body(Map.of("error", "Unable to retrieve the weather. Please try again."));
 }
}

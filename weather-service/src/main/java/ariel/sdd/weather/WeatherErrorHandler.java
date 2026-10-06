package ariel.sdd.weather;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.net.http.HttpTimeoutException;
import java.util.Map;
import java.util.concurrent.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class WeatherErrorHandler {
 private static final Logger LOG = LoggerFactory.getLogger(WeatherErrorHandler.class);

 @ExceptionHandler({CompletionException.class, ExecutionException.class, IOException.class,
                    TimeoutException.class, RuntimeException.class})
 public ResponseEntity<Map<String, String>> providerFailure(Exception error) {
  Throwable cause = error;
  while ((cause instanceof CompletionException || cause instanceof ExecutionException) && cause.getCause() != null) cause = cause.getCause();
  LOG.warn("Weather provider failure: {}: {}", cause.getClass().getSimpleName(), cause.getMessage());
  int status = cause instanceof TimeoutException || cause instanceof HttpTimeoutException ? 504 : 502;
  return ResponseEntity.status(status).body(Map.of("error", "Unable to retrieve the weather. Please try again."));
 }
}

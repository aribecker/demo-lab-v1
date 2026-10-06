package ariel.sdd.weather;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.concurrent.*;

/** Calls the independently deployed weather microservice; never contacts providers. */
@Service
public class WeatherService {
 private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
 private final ObjectMapper json;
 private final String url;
 private final long timeout;
 public WeatherService(ObjectMapper json, @Value("${weather.service-url}") String url,
                       @Value("${weather.client-timeout-seconds:90}") long timeout) {
  this.json = json; this.url = url; this.timeout = timeout;
 }
 public CompletableFuture<WeatherData> weather() {
  var request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(timeout))
      .header("Accept", "application/json").GET().build();
  return client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).thenApply(response -> {
   if (response.statusCode() == 504) throw new CompletionException(new TimeoutException("Weather microservice deadline"));
   if (response.statusCode() != 200) throw new CompletionException(new IOException("Weather microservice HTTP " + response.statusCode()));
   try {
    WeatherData weather = json.readValue(response.body(), WeatherData.class);
    if (weather.location() == null || weather.source() == null || weather.units() == null)
      throw new IOException("Invalid weather microservice response");
    return weather;
   } catch (IOException error) { throw new CompletionException(error); }
  });
 }
}

package ariel.sdd.weather;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.io.IOException;
import java.util.concurrent.*;
@Service
public class WeatherGateway {
 private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
 private final ObjectMapper json; private final String endpoint; private final long timeout;
 public WeatherGateway(ObjectMapper json,@Value("${weather.service-url}") String endpoint,@Value("${weather.client-timeout-seconds}") long timeout) {
  this.json=json;this.endpoint=endpoint;this.timeout=timeout;
 }
 public CompletableFuture<WeatherData> fetch() {
  var request=HttpRequest.newBuilder(URI.create(endpoint)).timeout(Duration.ofSeconds(timeout)).header("Accept","application/json").GET().build();
  return http.sendAsync(request,HttpResponse.BodyHandlers.ofString()).thenApply(response -> {
   if(response.statusCode()==504) throw new CompletionException(new TimeoutException("Downstream weather timeout"));
   if(response.statusCode()!=200) throw new CompletionException(new IOException("Downstream weather HTTP "+response.statusCode()));
   try {
    WeatherData data=json.readValue(response.body(),WeatherData.class);
    if(data==null || data.location()==null || data.source()==null || data.units()==null) throw new IOException("Invalid weather contract");
    return data;
   } catch(IOException error) { throw new CompletionException(error); }
  });
 }
}

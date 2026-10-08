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
 private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(WeatherGateway.class);
 private final HttpClient http;
 private final ObjectMapper json; private final String endpoint; private final long timeout;
 public WeatherGateway(ObjectMapper json,@Value("${weather.service-url}") String endpoint,@Value("${weather.client-timeout-seconds}") long timeout) {
  this.json=json;this.endpoint=endpoint;this.timeout=timeout;
  this.http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(timeout)).build();
 }
 public CompletableFuture<WeatherData> fetch(String trace) {
  String id=Diagnostics.id(trace);long start=System.nanoTime();
  log.info("WEATHER_TRACE id={} stage=backend-to-weather event=start endpoint={} timeoutSeconds={}",id,endpoint,timeout);
  var request=HttpRequest.newBuilder(URI.create(endpoint)).timeout(Duration.ofSeconds(timeout)).header("X-Request-Id",id).header("Accept","application/json").GET().build();
  return http.sendAsync(request,HttpResponse.BodyHandlers.ofString()).thenApply(response -> {
   log.info("WEATHER_TRACE id={} stage=backend-to-weather event=response status={} elapsedMs={} contentType={} bytes={}",id,response.statusCode(),Diagnostics.ms(start),response.headers().firstValue("Content-Type").orElse("unknown"),response.body().length());
   if(response.statusCode()==504) throw new CompletionException(new TimeoutException("Downstream weather timeout"));
   if(response.statusCode()!=200) throw new CompletionException(new IOException("Downstream weather HTTP "+response.statusCode()));
   try {
    WeatherData data=json.readValue(response.body(),WeatherData.class);
    if(data==null || data.location()==null || data.source()==null || data.units()==null) throw new IOException("Invalid weather contract");
    log.info("WEATHER_TRACE id={} stage=backend-to-weather event=success provider={} elapsedMs={}",id,data.source(),Diagnostics.ms(start));return data;
   } catch(IOException error) { throw new CompletionException(error); }
  }).whenComplete((data,error)->{if(error!=null)Diagnostics.failure(log,id,"backend-to-weather",start,error);});
 }
}

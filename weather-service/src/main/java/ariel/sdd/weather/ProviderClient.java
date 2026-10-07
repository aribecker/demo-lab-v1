package ariel.sdd.weather;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import com.fasterxml.jackson.databind.*;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.io.IOException;
import java.util.concurrent.*;
@Service
public class ProviderClient {
 private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
 private final ObjectMapper json;private final String primary,secondary;private final long deadline;
 public ProviderClient(ObjectMapper json,@Value("${weather.primary-url}") String primary,@Value("${weather.secondary-url}") String secondary,@Value("${weather.deadline-seconds}") long deadline) {
  this.json=json;this.primary=primary;this.secondary=secondary;this.deadline=deadline;
 }
 private CompletableFuture<JsonNode> request(String endpoint) {
  var request=HttpRequest.newBuilder(URI.create(endpoint)).timeout(Duration.ofSeconds(5)).header("User-Agent","SDD-Regeneration-Weather/0.0.8").GET().build();
  return http.sendAsync(request,HttpResponse.BodyHandlers.ofString()).thenApply(response -> {
   if(response.statusCode()!=200)throw new CompletionException(new IOException("Provider HTTP "+response.statusCode()));
   try { return json.readTree(response.body()); }catch(IOException e){throw new CompletionException(e);}
  });
 }
 public CompletableFuture<WeatherData> fetch() {
  return request(primary).thenApply(this::openMeteo)
   .exceptionallyCompose(error -> request(secondary).thenApply(this::metNorway))
   .orTimeout(deadline,TimeUnit.SECONDS);
 }
 private double number(JsonNode node,String field) {
  var value=node.get(field);
  if(value==null || !value.isNumber() || !Double.isFinite(value.doubleValue())) throw new IllegalArgumentException("Invalid provider number: "+field);
  return value.doubleValue();
 }
 private WeatherData data(String source,String url,double temp,Double feels,double humidity,double wind,Double code,String time,String kind) {
  return new WeatherData("Buenos Aires, Argentina",source,url,"America/Argentina/Buenos_Aires",new WeatherData.Units("°C","%","km/h"),temp,feels,humidity,wind,code,time,kind);
 }
 private WeatherData openMeteo(JsonNode root) {
  JsonNode c=root.path("current");String time=c.path("time").asText();LocalDateTime.parse(time);
  return data("Open-Meteo","https://open-meteo.com/",number(c,"temperature_2m"),number(c,"apparent_temperature"),number(c,"relative_humidity_2m"),number(c,"wind_speed_10m"),number(c,"weather_code"),time,null);
 }
 private WeatherData metNorway(JsonNode root) {
  JsonNode nearest=null;long distance=Long.MAX_VALUE;Instant now=Instant.now();
  for(JsonNode point:root.path("properties").path("timeseries")) {
   long difference=Math.abs(Duration.between(now,Instant.parse(point.path("time").asText())).toMillis());
   if(difference<distance){nearest=point;distance=difference;}
  }
  if(nearest==null)throw new IllegalArgumentException("Missing forecast");
  JsonNode c=nearest.path("data").path("instant").path("details");
  return data("MET Norway","https://www.met.no/",number(c,"air_temperature"),null,number(c,"relative_humidity"),Math.round(number(c,"wind_speed")*36)/10.0,null,nearest.path("time").asText(),"Forecast for the nearest hour");
 }
}

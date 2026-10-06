package ariel.sdd.weather;

import com.google.gson.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.concurrent.*;

@Service
public class WeatherService {
 private static final Gson JSON = new GsonBuilder().serializeNulls().create();
 private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
 private final String primary;
 private final String secondary;
 private final long deadlineSeconds;

 public WeatherService(@Value("${weather.primary-url}") String primary,
                       @Value("${weather.secondary-url}") String secondary,
                       @Value("${weather.deadline-seconds:10}") long deadlineSeconds) {
  this.primary = primary;
  this.secondary = secondary;
  this.deadlineSeconds = deadlineSeconds;
 }

 private CompletableFuture<JsonObject> request(String url) {
  HttpRequest request = HttpRequest.newBuilder(URI.create(url))
      .timeout(Duration.ofSeconds(5))
      .header("User-Agent", "Ariel-SDD-Weather/0.0.7 https://ariel-sdd-weather-java.onrender.com/")
      .header("Cache-Control", "no-cache").GET().build();
  return client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).thenApply(response -> {
   if (response.statusCode() != 200) throw new CompletionException(new IOException("Provider HTTP " + response.statusCode()));
   return JsonParser.parseString(response.body()).getAsJsonObject();
  });
 }

 public CompletableFuture<WeatherData> weather() {
  return request(primary).thenApply(WeatherService::fromOpenMeteo)
      .exceptionallyCompose(error -> request(secondary).thenApply(WeatherService::fromMet))
      .thenApply(data -> JSON.fromJson(data, WeatherData.class))
      .orTimeout(deadlineSeconds, TimeUnit.SECONDS);
 }

 static JsonObject base(String source,String url){
  JsonObject w=new JsonObject();w.addProperty("location","Buenos Aires, Argentina");w.addProperty("source",source);w.addProperty("sourceUrl",url);w.addProperty("timezone","America/Argentina/Buenos_Aires");
  JsonObject units=new JsonObject();units.addProperty("temperature","°C");units.addProperty("humidity","%");units.addProperty("windSpeed","km/h");w.add("units",units);return w;
 }
 static double number(JsonObject obj,String key){double n=obj.get(key).getAsDouble();if(!Double.isFinite(n))throw new IllegalArgumentException("Invalid number");return n;}
 static JsonObject fromOpenMeteo(JsonObject data){
  JsonObject c=data.getAsJsonObject("current"),w=base("Open-Meteo","https://open-meteo.com/");
  w.addProperty("temperature",number(c,"temperature_2m"));w.addProperty("apparentTemperature",number(c,"apparent_temperature"));w.addProperty("humidity",number(c,"relative_humidity_2m"));w.addProperty("windSpeed",number(c,"wind_speed_10m"));w.addProperty("weatherCode",number(c,"weather_code"));
  String time=c.get("time").getAsString();LocalDateTime.parse(time);w.addProperty("observedAt",time);return w;
 }
 static JsonObject fromMet(JsonObject data){
  JsonArray times=data.getAsJsonObject("properties").getAsJsonArray("timeseries");JsonObject nearest=null;long distance=Long.MAX_VALUE,now=System.currentTimeMillis();
  for(JsonElement entry:times){JsonObject point=entry.getAsJsonObject();long d=Math.abs(Instant.parse(point.get("time").getAsString()).toEpochMilli()-now);if(d<distance){distance=d;nearest=point;}}
  if(nearest==null)throw new IllegalArgumentException("No forecast");
  JsonObject c=nearest.getAsJsonObject("data").getAsJsonObject("instant").getAsJsonObject("details"),w=base("MET Norway","https://www.met.no/");
  w.addProperty("temperature",number(c,"air_temperature"));w.addProperty("humidity",number(c,"relative_humidity"));w.addProperty("windSpeed",Math.round(number(c,"wind_speed")*36)/10.0);w.add("apparentTemperature",JsonNull.INSTANCE);w.add("weatherCode",JsonNull.INSTANCE);w.addProperty("observedAt",nearest.get("time").getAsString());w.addProperty("dataKind","Forecast for the nearest hour");return w;
 }
}

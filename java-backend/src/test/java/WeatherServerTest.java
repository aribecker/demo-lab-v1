import com.sun.net.httpserver.*;
import com.google.gson.*;
import java.net.*;
import java.net.http.*;
import java.time.*;
import java.util.concurrent.atomic.*;
public class WeatherServerTest {
 static void check(boolean value,String reason){if(!value)throw new AssertionError(reason);}
 public static void main(String[] args)throws Exception{
  AtomicInteger primaryCalls=new AtomicInteger(),secondaryCalls=new AtomicInteger(),mode=new AtomicInteger();
  HttpServer fixture=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  fixture.createContext("/primary",ex->{primaryCalls.incrementAndGet();String body="{\"current\":{\"time\":\"2026-10-04T20:00\",\"temperature_2m\":18,\"apparent_temperature\":17,\"relative_humidity_2m\":60,\"wind_speed_10m\":12,\"weather_code\":0}}";WeatherServer.send(ex,mode.get()==0?200:429,"application/json",body.getBytes());});
  fixture.createContext("/secondary",ex->{secondaryCalls.incrementAndGet();String body="{\"properties\":{\"timeseries\":[{\"time\":\""+Instant.now()+"\",\"data\":{\"instant\":{\"details\":{\"air_temperature\":19,\"relative_humidity\":65,\"wind_speed\":3}}}}]}}";WeatherServer.send(ex,mode.get()==2?503:200,"application/json",body.getBytes());});fixture.start();
  String upstream="http://127.0.0.1:"+fixture.getAddress().getPort();
  HttpServer app=WeatherServer.server(0,new WeatherServer.WeatherService(upstream+"/primary",upstream+"/secondary"));app.start();String base="http://127.0.0.1:"+app.getAddress().getPort();HttpClient client=HttpClient.newHttpClient();
  try{
   for(int i=0;i<2;i++){var response=client.send(HttpRequest.newBuilder(URI.create(base+"/api/hello")).build(),HttpResponse.BodyHandlers.ofString());check(response.statusCode()==200,"success status");JsonObject data=JsonParser.parseString(response.body()).getAsJsonObject();check(data.get("version").getAsString().equals("003"),"app version");check(data.get("message").getAsString().equals("Hello World · Versión 003"),"versioned hello message");check(data.getAsJsonObject("weather").get("temperature").getAsDouble()==18,"temperature");check(response.headers().firstValue("cache-control").orElse("").equals("no-store"),"cache");}
   check(primaryCalls.get()==2,"one upstream per click");check(secondaryCalls.get()==0,"no unnecessary fallback");
   mode.set(1);var fallback=client.send(HttpRequest.newBuilder(URI.create(base+"/api/hello")).build(),HttpResponse.BodyHandlers.ofString());JsonObject weather=JsonParser.parseString(fallback.body()).getAsJsonObject().getAsJsonObject("weather");check(weather.get("source").getAsString().equals("MET Norway"),"fallback source");check(weather.get("windSpeed").getAsDouble()==10.8,"unit conversion");check(weather.get("apparentTemperature").isJsonNull(),"missing apparent temperature");
   mode.set(2);check(client.send(HttpRequest.newBuilder(URI.create(base+"/api/hello")).build(),HttpResponse.BodyHandlers.ofString()).statusCode()==502,"both failed");
   for(String path:new String[]{"/","/app.js","/styles.css","/health"})check(client.send(HttpRequest.newBuilder(URI.create(base+path)).build(),HttpResponse.BodyHandlers.ofString()).statusCode()==200,"asset "+path);
   check(client.send(HttpRequest.newBuilder(URI.create(base+"/missing")).build(),HttpResponse.BodyHandlers.ofString()).statusCode()==404,"404");
   check(client.send(HttpRequest.newBuilder(URI.create(base+"/api/hello")).POST(HttpRequest.BodyPublishers.noBody()).build(),HttpResponse.BodyHandlers.ofString()).statusCode()==405,"405");
   System.out.println("Java tests passed: fresh async requests, fallback, units, failure, assets, health and methods");
  }finally{app.stop(0);fixture.stop(0);}System.exit(0);
 }
}

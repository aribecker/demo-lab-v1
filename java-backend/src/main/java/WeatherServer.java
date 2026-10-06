import com.google.gson.*;
import com.sun.net.httpserver.*;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.concurrent.*;

public class WeatherServer {
 static final String APP_VERSION = "003";
 static final Gson JSON=new GsonBuilder().serializeNulls().create();
 static final String PRIMARY="https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=America%2FArgentina%2FBuenos_Aires";
 static final String SECONDARY="https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=-34.6037&lon=-58.3816";
 static final HttpClient CLIENT=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
 static class WeatherService {
  final String primary,secondary;
  WeatherService(String p,String s){primary=p;secondary=s;}
  CompletableFuture<JsonObject> request(String url){
   HttpRequest req=HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(5)).header("User-Agent","Ariel-SDD-Weather/0.3 https://ariel-ssd-full-stack-0080.aribecker2.chatgpt.site").header("Cache-Control","no-cache").GET().build();
   return CLIENT.sendAsync(req,HttpResponse.BodyHandlers.ofString()).thenApply(r->{if(r.statusCode()!=200)throw new CompletionException(new IOException("Provider HTTP "+r.statusCode()));return JsonParser.parseString(r.body()).getAsJsonObject();});
  }
  CompletableFuture<JsonObject> weather(){
   return request(primary).thenApply(WeatherServer::fromOpenMeteo).exceptionallyCompose(e->request(secondary).thenApply(WeatherServer::fromMet)).orTimeout(10,TimeUnit.SECONDS);
  }
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
  w.addProperty("temperature",number(c,"air_temperature"));w.addProperty("humidity",number(c,"relative_humidity"));w.addProperty("windSpeed",Math.round(number(c,"wind_speed")*36)/10.0);w.add("apparentTemperature",JsonNull.INSTANCE);w.add("weatherCode",JsonNull.INSTANCE);w.addProperty("observedAt",nearest.get("time").getAsString());w.addProperty("dataKind","Pronóstico para la hora más cercana");return w;
 }
 static void send(HttpExchange ex,int status,String type,byte[] body){try{ex.getResponseHeaders().set("Content-Type",type);ex.getResponseHeaders().set("Cache-Control","no-store");ex.sendResponseHeaders(status,body.length);ex.getResponseBody().write(body);}catch(IOException ignored){}finally{ex.close();}}
 static void json(HttpExchange ex,int status,JsonObject data){send(ex,status,"application/json; charset=utf-8",JSON.toJson(data).getBytes(StandardCharsets.UTF_8));}
 static HttpServer server(int port,WeatherService service)throws IOException{
  HttpServer server=HttpServer.create(new InetSocketAddress("0.0.0.0",port),0);server.setExecutor(Executors.newCachedThreadPool());
  server.createContext("/",ex->{
   if(!ex.getRequestMethod().equals("GET")){send(ex,405,"text/plain",new byte[0]);return;}
   String path=ex.getRequestURI().getPath();
   if(path.equals("/health")){send(ex,200,"text/plain","ok".getBytes(StandardCharsets.UTF_8));return;}
   if(path.equals("/api/hello")){
    service.weather().whenComplete((weather,error)->{if(error!=null){Throwable cause=error;while(cause.getCause()!=null)cause=cause.getCause();System.err.println("Weather provider failure: "+cause.getClass().getSimpleName()+": "+cause.getMessage());JsonObject err=new JsonObject();err.addProperty("error","No se pudo consultar el clima. Volvé a intentar.");json(ex,cause instanceof TimeoutException||cause instanceof HttpTimeoutException?504:502,err);}else{JsonObject response=new JsonObject();response.addProperty("message","Hello World · Versión "+APP_VERSION);response.addProperty("version",APP_VERSION);response.add("weather",weather);response.addProperty("timestamp",Instant.now().toString());response.addProperty("architecture","Browser → Java API → "+weather.get("source").getAsString()+" → JSON → Browser");json(ex,200,response);}});return;
   }
   String file=switch(path){case "/"->"index.html";case "/app.js"->"app.js";case "/styles.css"->"styles.css";default->null;};
   if(file==null){send(ex,404,"text/plain","Not found".getBytes(StandardCharsets.UTF_8));return;}
   try(InputStream input=WeatherServer.class.getResourceAsStream("/public/"+file)){if(input==null)throw new IOException("Missing asset");send(ex,200,file.endsWith("html")?"text/html; charset=utf-8":file.endsWith("js")?"text/javascript; charset=utf-8":"text/css; charset=utf-8",input.readAllBytes());}
  });return server;
 }
 public static void main(String[] args)throws Exception{int port=Integer.parseInt(System.getenv().getOrDefault("PORT","8080"));HttpServer server=server(port,new WeatherService(PRIMARY,SECONDARY));server.start();System.out.println("Java SDD Weather listening on port "+port);}
}

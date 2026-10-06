package ariel.sdd.weather;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.JsonNode;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WeatherIntegrationTest {
 static final AtomicInteger mode = new AtomicInteger(), primaryCalls = new AtomicInteger();
 static final ExecutorService executor = Executors.newCachedThreadPool();
 static final HttpServer fixture;
 static {
  try {
   fixture = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
   fixture.setExecutor(executor);
   fixture.createContext("/", exchange -> {
    if (mode.get() == 3) try { Thread.sleep(1600); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    primaryCalls.incrementAndGet();
    String body = "{\"location\":\"Buenos Aires, Argentina\",\"source\":\"Open-Meteo\",\"units\":{\"temperature\":\"°C\",\"humidity\":\"%\",\"windSpeed\":\"km/h\"},\"temperature\":18,\"humidity\":60,\"windSpeed\":12}";
    int status = mode.get() == 2 ? 502 : mode.get() == 4 ? 504 : 200;
    if (mode.get() == 5) body = "{}";
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    try { exchange.sendResponseHeaders(status, bytes.length); exchange.getResponseBody().write(bytes); }
    finally { exchange.close(); }
   });
   fixture.start();
  } catch (Exception e) { throw new ExceptionInInitializerError(e); }
 }
 @DynamicPropertySource
 static void providers(DynamicPropertyRegistry registry) {
  String base = "http://127.0.0.1:" + fixture.getAddress().getPort();
  registry.add("weather.service-url", () -> base + "/weather");
  registry.add("weather.client-timeout-seconds", () -> 1);
 }
 @Autowired TestRestTemplate client;
 @AfterAll static void stop() { fixture.stop(0); executor.shutdownNow(); }

 @Test void restContractFallbackFailureTimeoutAndAssets() {
  for (int i = 0; i < 2; i++) {
   var response = client.getForEntity("/api/hello", JsonNode.class);
   assertEquals(HttpStatus.OK, response.getStatusCode());
   assertEquals("no-store", response.getHeaders().getFirst("Cache-Control"));
   JsonNode data = response.getBody();
   assertEquals("0.0.8", data.path("version").asText());
   assertEquals("Hello World · Version 0.0.8", data.path("message").asText());
   assertEquals(18, data.path("weather").path("temperature").asDouble());
   assertTrue(data.path("architecture").asText().contains("Weather microservice"));
  }
  assertEquals(2, primaryCalls.get());
  mode.set(2);
  var failure = client.getForEntity("/api/hello", JsonNode.class);
  assertEquals(HttpStatus.BAD_GATEWAY, failure.getStatusCode());
  assertEquals("Unable to retrieve the weather. Please try again.", failure.getBody().path("error").asText());
  mode.set(4);
  assertEquals(HttpStatus.GATEWAY_TIMEOUT, client.getForEntity("/api/hello", String.class).getStatusCode());
  mode.set(5);
  assertEquals(HttpStatus.BAD_GATEWAY, client.getForEntity("/api/hello", String.class).getStatusCode());
  mode.set(3);
  assertEquals(HttpStatus.GATEWAY_TIMEOUT, client.getForEntity("/api/hello", String.class).getStatusCode());
  mode.set(0);
  for (String path : new String[]{"/", "/app.js", "/styles.css", "/health"})
   assertEquals(HttpStatus.OK, client.getForEntity(path, String.class).getStatusCode(), path);
  assertEquals("ok", client.getForObject("/health", String.class));
  assertTrue(client.getForObject("/", String.class).contains("Version 0.0.8"));
  assertEquals(HttpStatus.NOT_FOUND, client.getForEntity("/missing", String.class).getStatusCode());
  assertEquals(HttpStatus.METHOD_NOT_ALLOWED, client.postForEntity("/api/hello", null, String.class).getStatusCode());
 }
}

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
    boolean primary = exchange.getRequestURI().getPath().equals("/primary");
    if (primary) primaryCalls.incrementAndGet();
    if (mode.get() == 3) try { Thread.sleep(1600); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    String body = primary
        ? "{\"current\":{\"time\":\"2026-10-06T02:00\",\"temperature_2m\":18,\"apparent_temperature\":17,\"relative_humidity_2m\":60,\"wind_speed_10m\":12,\"weather_code\":0}}"
        : "{\"properties\":{\"timeseries\":[{\"time\":\"" + Instant.now() + "\",\"data\":{\"instant\":{\"details\":{\"air_temperature\":19,\"relative_humidity\":65,\"wind_speed\":3}}}}]}}";
    int status = mode.get() == 2 ? 503 : primary && mode.get() == 1 ? 429 : 200;
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
  registry.add("weather.primary-url", () -> base + "/primary");
  registry.add("weather.secondary-url", () -> base + "/secondary");
  registry.add("weather.deadline-seconds", () -> 1);
 }
 @Autowired TestRestTemplate client;
 @AfterAll static void stop() { fixture.stop(0); executor.shutdownNow(); }

 @Test void restContractFallbackFailureTimeoutAndAssets() {
  for (int i = 0; i < 2; i++) {
   var response = client.getForEntity("/api/hello", JsonNode.class);
   assertEquals(HttpStatus.OK, response.getStatusCode());
   assertEquals("no-store", response.getHeaders().getFirst("Cache-Control"));
   JsonNode data = response.getBody();
   assertEquals("0.0.7", data.path("version").asText());
   assertEquals("Hello World · Version 0.0.7", data.path("message").asText());
   assertEquals(18, data.path("weather").path("temperature").asDouble());
   assertTrue(data.path("architecture").asText().contains("Spring Boot REST API"));
  }
  assertEquals(2, primaryCalls.get());
  mode.set(1);
  var fallback = client.getForObject("/api/hello", JsonNode.class).path("weather");
  assertEquals("MET Norway", fallback.path("source").asText());
  assertEquals(10.8, fallback.path("windSpeed").asDouble());
  assertTrue(fallback.path("apparentTemperature").isNull());
  assertEquals("Forecast for the nearest hour", fallback.path("dataKind").asText());
  mode.set(2);
  var failure = client.getForEntity("/api/hello", JsonNode.class);
  assertEquals(HttpStatus.BAD_GATEWAY, failure.getStatusCode());
  assertEquals("Unable to retrieve the weather. Please try again.", failure.getBody().path("error").asText());
  mode.set(3);
  assertEquals(HttpStatus.GATEWAY_TIMEOUT, client.getForEntity("/api/hello", String.class).getStatusCode());
  mode.set(0);
  for (String path : new String[]{"/", "/app.js", "/styles.css", "/health"})
   assertEquals(HttpStatus.OK, client.getForEntity(path, String.class).getStatusCode(), path);
  assertEquals("ok", client.getForObject("/health", String.class));
  assertTrue(client.getForObject("/", String.class).contains("Version 0.0.7"));
  assertEquals(HttpStatus.NOT_FOUND, client.getForEntity("/missing", String.class).getStatusCode());
  assertEquals(HttpStatus.METHOD_NOT_ALLOWED, client.postForEntity("/api/hello", null, String.class).getStatusCode());
 }
}

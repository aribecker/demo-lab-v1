package ariel.iteration2.weather;

import com.fasterxml.jackson.databind.JsonNode;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WeatherApiTest {
    private static final String GOOD_PRIMARY = """
            {"current":{"time":"2026-10-20T09:00","temperature_2m":21.4,
            "apparent_temperature":20.1,"relative_humidity_2m":64,"wind_speed_10m":12.3}}
            """;
    private static final String GOOD_FORECAST = """
            {"properties":{"timeseries":[
            {"time":"2026-10-20T15:00:00Z","data":{"instant":{"details":{
            "air_temperature":31,"relative_humidity":55,"wind_speed":1}}}},
            {"time":"2026-10-20T12:00:00Z","data":{"instant":{"details":{
            "air_temperature":22.5,"relative_humidity":68,"wind_speed":3.5}}}}]}}
            """;
    private static final AtomicReference<String> primaryMode = new AtomicReference<>("ok");
    private static final AtomicReference<String> fallbackMode = new AtomicReference<>("ok");
    private static final AtomicInteger primaryCalls = new AtomicInteger();
    private static final AtomicInteger fallbackCalls = new AtomicInteger();
    private static final ExecutorService executor = Executors.newCachedThreadPool();
    private static final HttpServer fixture = startFixture();

    @Autowired TestRestTemplate http;

    @TestConfiguration
    static class FixedTime {
        @Bean @Primary Clock testClock() {
            return Clock.fixed(Instant.parse("2026-10-20T12:10:00Z"), ZoneOffset.UTC);
        }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("weather.primary-url", () -> fixtureUrl("/primary"));
        registry.add("weather.fallback-url", () -> fixtureUrl("/fallback"));
        registry.add("weather.provider-timeout-ms", () -> 500);
        registry.add("app.allowed-origins", () -> "https://example.test,http://localhost:5173");
    }

    @BeforeEach void reset() {
        primaryMode.set("ok");
        fallbackMode.set("ok");
        primaryCalls.set(0);
        fallbackCalls.set(0);
    }

    @AfterAll static void stop() {
        fixture.stop(0);
        executor.shutdownNow();
    }

    @Test void primaryNormalizesDataAndCorrelatesResponse() {
        ResponseEntity<JsonNode> response = getWeather();
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        JsonNode body = response.getBody();
        assertThat(body.path("version").asText()).isEqualTo("2.0.0");
        assertThat(body.path("city").asText()).isEqualTo("Buenos Aires, Argentina");
        assertThat(body.path("temperatureC").asDouble()).isEqualTo(21.4);
        assertThat(body.path("feelsLikeC").asDouble()).isEqualTo(20.1);
        assertThat(body.path("humidityPercent").asDouble()).isEqualTo(64);
        assertThat(body.path("windKmh").asDouble()).isEqualTo(12.3);
        assertThat(body.path("observedAt").asText()).isEqualTo("2026-10-20T12:00:00Z");
        assertThat(body.path("requestedAt").asText()).isEqualTo("2026-10-20T12:10:00Z");
        assertThat(body.path("timezone").asText()).isEqualTo("America/Argentina/Buenos_Aires");
        assertThat(body.path("dataType").asText()).isEqualTo("current model data");
        assertThat(body.path("providerUrl").asText()).isEqualTo("https://open-meteo.com/");
        assertThat(body.path("requestId").asText()).matches("[a-f0-9-]{36}")
                .isEqualTo(response.getHeaders().getFirst("X-Request-Id"));
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(primaryCalls.get()).isEqualTo(1);
        assertThat(fallbackCalls.get()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"http", "json", "number", "time", "humidity", "negative", "missing"})
    void invalidPrimaryUsesNearestForecast(String failure) {
        primaryMode.set(failure);
        ResponseEntity<JsonNode> response = getWeather();
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        JsonNode body = response.getBody();
        assertThat(body.path("provider").asText()).isEqualTo("MET Norway");
        assertThat(body.path("dataType").asText()).isEqualTo("nearest-hour forecast");
        assertThat(body.path("temperatureC").asDouble()).isEqualTo(22.5);
        assertThat(body.path("windKmh").asDouble()).isEqualTo(12.6);
        assertThat(body.path("observedAt").asText()).isEqualTo("2026-10-20T12:00:00Z");
        assertThat(body.path("feelsLikeC").isNull()).isTrue();
        assertThat(primaryCalls.get()).isEqualTo(1);
        assertThat(fallbackCalls.get()).isEqualTo(1);
    }

    @Test void bothFailuresAreSafeAndNotRetryable() {
        primaryMode.set("http");
        fallbackMode.set("json");
        ResponseEntity<JsonNode> response = getWeather();
        assertThat(response.getStatusCode().value()).isEqualTo(502);
        assertThat(response.getBody().path("code").asText()).isEqualTo("PROVIDER_UNAVAILABLE");
        assertThat(response.getBody().path("retryable").asBoolean()).isFalse();
        assertThat(response.getBody().path("requestId").asText())
                .isEqualTo(response.getHeaders().getFirst("X-Request-Id"));
        assertThat(response.getBody().has("temperatureC")).isFalse();
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
    }

    @Test void twoTimeoutsReturn504WithinBound() {
        primaryMode.set("timeout");
        fallbackMode.set("timeout");
        long start = System.nanoTime();
        ResponseEntity<JsonNode> response = getWeather();
        assertThat(response.getStatusCode().value()).isEqualTo(504);
        assertThat(response.getBody().path("retryable").asBoolean()).isFalse();
        assertThat((System.nanoTime() - start) / 1_000_000).isLessThan(2500);
    }

    @Test void primaryTimeoutCanRecoverWithFallback() {
        primaryMode.set("timeout");
        assertThat(getWeather().getBody().path("provider").asText()).isEqualTo("MET Norway");
    }

    @Test void healthDoesNotFetchWeather() {
        ResponseEntity<JsonNode> response = http.getForEntity("/health", JsonNode.class);
        assertThat(response.getBody().path("status").asText()).isEqualTo("UP");
        assertThat(response.getBody().path("version").asText()).isEqualTo("2.0.0");
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(primaryCalls.get() + fallbackCalls.get()).isZero();
    }

    @Test void corsSupportsOnlyConfiguredOriginAndExposesRequestId() {
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("https://example.test");
        ResponseEntity<String> response = http.exchange("/health", HttpMethod.GET,
                new HttpEntity<>(headers), String.class);
        assertThat(response.getHeaders().getAccessControlAllowOrigin()).isEqualTo("https://example.test");
        assertThat(response.getHeaders().getAccessControlExposeHeaders()).contains("X-Request-Id");
        assertThat(response.getHeaders().getAccessControlAllowCredentials()).isFalse();
        headers.set("Access-Control-Request-Method", "GET");
        response = http.exchange("/api/weather", HttpMethod.OPTIONS, new HttpEntity<>(headers), String.class);
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getHeaders().getAccessControlAllowMethods()).contains(HttpMethod.GET, HttpMethod.OPTIONS);
        headers.setOrigin("https://unlisted.test");
        response = http.exchange("/api/weather", HttpMethod.OPTIONS, new HttpEntity<>(headers), String.class);
        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(response.getHeaders().getAccessControlAllowOrigin()).isNull();
        assertThat(primaryCalls.get()).isZero();
    }

    @Test void unsupportedMethodsAndPathsAreRejected() {
        assertThat(http.postForEntity("/api/weather", null, String.class).getStatusCode().value()).isEqualTo(405);
        assertThat(http.getForEntity("/missing", String.class).getStatusCode().value()).isEqualTo(404);
        assertThat(primaryCalls.get()).isZero();
    }

    private ResponseEntity<JsonNode> getWeather() {
        return http.getForEntity("/api/weather", JsonNode.class);
    }

    private static String fixtureUrl(String path) {
        return "http://127.0.0.1:" + fixture.getAddress().getPort() + path;
    }

    private static HttpServer startFixture() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            server.setExecutor(executor);
            server.createContext("/primary", exchange -> serve(exchange, primaryMode.get(), true));
            server.createContext("/fallback", exchange -> serve(exchange, fallbackMode.get(), false));
            server.start();
            return server;
        } catch (IOException failure) {
            throw new ExceptionInInitializerError(failure);
        }
    }

    private static void serve(HttpExchange exchange, String mode, boolean primary) throws IOException {
        (primary ? primaryCalls : fallbackCalls).incrementAndGet();
        if (mode.equals("timeout")) {
            try { Thread.sleep(1400); }
            catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
        }
        String body = primary ? GOOD_PRIMARY : GOOD_FORECAST;
        body = switch (mode) {
            case "json" -> "<html>not provider JSON</html>";
            case "number" -> body.replace("21.4", "\"not-a-number\"");
            case "time" -> body.replace("2026-10-20T09:00", "yesterday");
            case "humidity" -> body.replace(":64", ":164");
            case "negative" -> body.replace(":12.3", ":-1");
            case "missing" -> "{}";
            default -> body;
        };
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        try {
            exchange.sendResponseHeaders(mode.equals("http") ? 503 : 200, bytes.length);
            exchange.getResponseBody().write(bytes);
        } finally { exchange.close(); }
    }
}

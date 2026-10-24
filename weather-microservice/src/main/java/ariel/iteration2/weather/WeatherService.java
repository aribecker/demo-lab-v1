package ariel.iteration2.weather;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
class WeatherService {
    private static final Logger LOG = LoggerFactory.getLogger(WeatherService.class);
    private static final ZoneId CITY_ZONE = ZoneId.of("America/Argentina/Buenos_Aires");
    private final HttpClient client;
    private final ObjectMapper mapper;
    private final Clock clock;
    private final URI primary;
    private final URI fallback;
    private final Duration timeout;

    WeatherService(HttpClient client, ObjectMapper mapper, Clock clock,
                   @Value("${weather.primary-url}") URI primary,
                   @Value("${weather.fallback-url}") URI fallback,
                   @Value("${weather.provider-timeout-ms}") long timeoutMs) {
        this.client = client;
        this.mapper = mapper;
        this.clock = clock;
        this.primary = primary;
        this.fallback = fallback;
        this.timeout = Duration.ofMillis(timeoutMs);
    }

    WeatherReading read(String requestId) {
        Instant requested = clock.instant();
        boolean primaryTimedOut;
        try {
            return fetch(primary, "Open-Meteo", requestId, requested);
        } catch (ProviderFailure failure) {
            primaryTimedOut = failure.timedOut;
        }
        try {
            return fetch(fallback, "MET Norway", requestId, requested);
        } catch (ProviderFailure failure) {
            throw new ProvidersUnavailable(primaryTimedOut && failure.timedOut);
        }
    }

    private WeatherReading fetch(URI uri, String provider, String id, Instant requested) {
        long started = System.nanoTime();
        try {
            HttpRequest request = HttpRequest.newBuilder(uri).timeout(timeout)
                    .header("Accept", "application/json")
                    .header("User-Agent", "ArielWeatherIteration2/2.0.0 (https://ariel-weather-iteration-2.onrender.com)")
                    .GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IOException("provider_http_" + response.statusCode());
            }
            JsonNode root = mapper.readTree(response.body());
            if (root == null) throw new IOException("empty_json");
            WeatherReading result = provider.equals("Open-Meteo")
                    ? normalizePrimary(root, requested, id) : normalizeForecast(root, requested, id);
            LOG.info("requestId={} provider={} status=200 elapsedMs={}", id, provider, elapsed(started));
            return result;
        } catch (HttpTimeoutException failure) {
            LOG.warn("requestId={} provider={} failure=timeout elapsedMs={}", id, provider, elapsed(started));
            throw new ProviderFailure(true);
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            LOG.warn("requestId={} provider={} failure=interrupted elapsedMs={}", id, provider, elapsed(started));
            throw new ProviderFailure(false);
        } catch (IOException | RuntimeException failure) {
            LOG.warn("requestId={} provider={} failure={} elapsedMs={}", id, provider,
                    failure.getClass().getSimpleName(), elapsed(started));
            throw new ProviderFailure(false);
        }
    }

    private WeatherReading normalizePrimary(JsonNode root, Instant requested, String id) {
        JsonNode current = root.path("current");
        double temperature = number(current, "temperature_2m");
        double feelsLike = number(current, "apparent_temperature");
        double humidity = humidity(current, "relative_humidity_2m");
        double wind = nonnegative(current, "wind_speed_10m");
        Instant observed = LocalDateTime.parse(current.path("time").asText())
                .atZone(CITY_ZONE).toInstant();
        return reading(temperature, feelsLike, humidity, wind, observed, requested,
                "Open-Meteo", "https://open-meteo.com/", "current model data", id);
    }

    private WeatherReading normalizeForecast(JsonNode root, Instant requested, String id) {
        JsonNode series = root.path("properties").path("timeseries");
        if (!series.isArray() || series.isEmpty()) throw new IllegalArgumentException("missing_forecast");
        JsonNode nearest = null;
        Instant nearestTime = null;
        Duration nearestDistance = null;
        for (JsonNode entry : series) {
            Instant time = Instant.parse(entry.path("time").asText());
            Duration distance = Duration.between(requested, time).abs();
            if (nearestDistance == null || distance.compareTo(nearestDistance) < 0) {
                nearest = entry;
                nearestTime = time;
                nearestDistance = distance;
            }
        }
        JsonNode values = nearest.path("data").path("instant").path("details");
        double wind = Math.round(nonnegative(values, "wind_speed") * 36.0) / 10.0;
        return reading(number(values, "air_temperature"), null, humidity(values, "relative_humidity"),
                wind, nearestTime, requested, "MET Norway", "https://www.met.no/", "nearest-hour forecast", id);
    }

    private WeatherReading reading(double temperature, Double feelsLike, double humidity, double wind,
                                   Instant observed, Instant requested, String provider,
                                   String providerUrl, String dataType, String id) {
        return new WeatherReading("2.0.0", "Buenos Aires, Argentina", temperature, feelsLike,
                humidity, wind, observed, requested, CITY_ZONE.getId(), provider, providerUrl, dataType, id);
    }

    private double number(JsonNode object, String key) {
        JsonNode value = object.path(key);
        if (!value.isNumber() || !Double.isFinite(value.doubleValue())) {
            throw new IllegalArgumentException("invalid_number");
        }
        return value.doubleValue();
    }

    private double humidity(JsonNode object, String key) {
        double value = number(object, key);
        if (value < 0 || value > 100) throw new IllegalArgumentException("invalid_humidity");
        return value;
    }

    private double nonnegative(JsonNode object, String key) {
        double value = number(object, key);
        if (value < 0) throw new IllegalArgumentException("negative_value");
        return value;
    }

    private long elapsed(long started) {
        return (System.nanoTime() - started) / 1_000_000;
    }

    private static class ProviderFailure extends RuntimeException {
        final boolean timedOut;
        ProviderFailure(boolean timedOut) { this.timedOut = timedOut; }
    }

    static class ProvidersUnavailable extends RuntimeException {
        final boolean timedOut;
        ProvidersUnavailable(boolean timedOut) { this.timedOut = timedOut; }
    }
}


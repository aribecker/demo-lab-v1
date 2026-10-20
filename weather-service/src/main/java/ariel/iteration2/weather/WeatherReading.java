package ariel.iteration2.weather;

import java.time.Instant;

public record WeatherReading(
        String version, String city, double temperatureC, Double feelsLikeC,
        double humidityPercent, double windKmh, Instant observedAt, Instant requestedAt,
        String timezone, String provider, String providerUrl, String dataType, String requestId) {
}

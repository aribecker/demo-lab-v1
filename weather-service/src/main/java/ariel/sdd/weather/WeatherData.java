package ariel.sdd.weather;

public record WeatherData(String location, String source, String sourceUrl, String timezone,
                          Units units, double temperature, Double apparentTemperature,
                          double humidity, double windSpeed, Double weatherCode,
                          String observedAt, String dataKind) {
 public record Units(String temperature, String humidity, String windSpeed) {}
}

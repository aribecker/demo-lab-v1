package ariel.sdd.weather;

public record WeatherResponse(String message, String version, WeatherData weather,
                              String timestamp, String architecture) {}

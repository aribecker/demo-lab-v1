package ariel.sdd.weather;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WeatherApplication {
 public static final String APP_VERSION = "0.0.7";
 public static void main(String[] args) {
  SpringApplication.run(WeatherApplication.class, args);
 }
}

package ariel.sdd.weather;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class WeatherApplication {
 public static final String VERSION = "0.0.8";
 public static void main(String[] args) { SpringApplication.run(WeatherApplication.class, args); }
}

package ariel.iteration2.weather;

import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
class WebConfiguration implements WebMvcConfigurer {
    private final String[] origins;

    WebConfiguration(@Value("${app.allowed-origins}") String origins) {
        this.origins = Arrays.stream(origins.split(",")).map(String::trim)
                .filter(origin -> !origin.isEmpty()).toArray(String[]::new);
    }

    @Bean
    HttpClient backendHttpClient() {
        return HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
    }

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    private String[] treasuryOrigins() {
        return java.util.stream.Stream.concat(Arrays.stream(origins), java.util.stream.Stream.of("https://ariel-treasury.onrender.com")).distinct().toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        for(String path : new String[]{"/api/treasury/**", "/auth/**"})
            registry.addMapping(path).allowedOrigins(treasuryOrigins()).allowedMethods("GET","POST","OPTIONS")
                .allowedHeaders("Accept","Content-Type","Authorization").allowCredentials(false).maxAge(600);
        registry.addMapping("/**").allowedOrigins(origins).allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Accept", "Content-Type", "X-Request-Id", "Authorization")
                .exposedHeaders("X-Request-Id").allowCredentials(false).maxAge(600);
    }
}



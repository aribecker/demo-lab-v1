package ariel.demo.people;

import java.io.IOException;
import java.util.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DataAccessException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
class ApiConfiguration implements WebMvcConfigurer {
    private final String[] origins;
    ApiConfiguration(@Value("${app.allowed-origins}") String origins) {
        this.origins = Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isBlank()).toArray(String[]::new);
    }
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(origins).allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept").allowCredentials(false).maxAge(600);
    }
}
@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class, IllegalArgumentException.class})
    ResponseEntity<?> invalid(Exception e) { return error(400, "Enter a name of 1–100 characters and valid request parameters."); }
    @ExceptionHandler(PeopleRepository.RequestConflict.class)
    ResponseEntity<?> conflict() { return error(409, "This request was already used for a different name. Refresh and try again."); }
    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<?> unavailable() { return error(503, "The people database is temporarily unavailable. Please try again."); }
    private ResponseEntity<?> error(int status, String message) { return ResponseEntity.status(status).body(Map.of("message", message)); }
}
@Component
class NoStoreFilter extends OncePerRequestFilter {
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        response.setHeader("Cache-Control", "no-store");
        chain.doFilter(request, response);
    }
}

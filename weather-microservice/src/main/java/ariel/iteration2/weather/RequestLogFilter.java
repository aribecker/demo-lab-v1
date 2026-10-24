package ariel.iteration2.weather;

import java.io.IOException;
import java.util.UUID;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
class RequestLogFilter extends OncePerRequestFilter {
    static final String REQUEST_ID = "weather.requestId";
    private static final Logger LOG = LoggerFactory.getLogger(RequestLogFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain chain) throws ServletException, IOException {
        String id = UUID.randomUUID().toString();
        request.setAttribute(REQUEST_ID, id);
        response.setHeader("X-Request-Id", id);
        response.setHeader("Cache-Control", "no-store");
        long started = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            LOG.info("requestId={} method={} status={} elapsedMs={}", id, request.getMethod(),
                    response.getStatus(), (System.nanoTime() - started) / 1_000_000);
        }
    }
}


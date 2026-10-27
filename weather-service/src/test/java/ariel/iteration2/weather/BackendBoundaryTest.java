package ariel.iteration2.weather;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties={"app.allowed-origins=https://integrated.test", "simulation.scheduling-enabled=false"})
class BackendBoundaryTest {
    @Autowired TestRestTemplate http;

    @Test void backendKeepsHealthButDoesNotServeWeather() {
        var response=http.getForEntity("/health",JsonNode.class);
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().path("status").asText()).isEqualTo("UP");
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(response.getHeaders().getFirst("X-Request-Id")).isNotBlank();
        assertThat(http.getForEntity("/api/weather",String.class).getStatusCode().value()).isEqualTo(404);
    }

    @Test void backendCorsStillAcceptsItsFrontendAndRejectsOtherOrigins() {
        var headers=new HttpHeaders();
        headers.setOrigin("https://integrated.test");
        var response=http.exchange("/health",HttpMethod.GET,new HttpEntity<>(headers),String.class);
        assertThat(response.getHeaders().getAccessControlAllowOrigin()).isEqualTo("https://integrated.test");
        headers.setOrigin("https://unlisted.test");
        response=http.exchange("/health",HttpMethod.GET,new HttpEntity<>(headers),String.class);
        assertThat(response.getStatusCode().value()).isEqualTo(403);
    }
}

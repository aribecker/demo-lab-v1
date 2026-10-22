package ariel.demo.people;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PreviewTest {
    @Autowired TestRestTemplate http;
    @Test void pendingDatabaseIsExplicitAndDoesNotFakePersistence() {
        var result = http.getForEntity("/api/people", String.class);
        assertThat(result.getStatusCode().value()).isEqualTo(503);
        assertThat(result.getBody()).contains("pending configuration", "No records");
    }
}

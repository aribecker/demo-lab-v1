package ariel.iteration2.weather.people;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"simulation.database-url=","simulation.scheduling-enabled=false"})
class PeopleBoundaryTest {
    @Autowired TestRestTemplate http;
    @Test void validatesNamesUuidsAndCursorsBeforeAccessingStorage() {
        assertEquals(400,http.postForEntity("/api/people",Map.of("name"," ","requestId","not-a-uuid"),String.class).getStatusCode().value());
        assertEquals(400,http.postForEntity("/api/people",Map.of("name","Ada","requestId","not-a-uuid"),String.class).getStatusCode().value());
        assertEquals(400,http.getForEntity("/api/people?limit=0",String.class).getStatusCode().value());
        assertEquals(400,http.getForEntity("/api/people?before=-1",String.class).getStatusCode().value());
    }
    @Test void missingStorageHasNoFakeListAndDoesNotBreakLoginOrSimulation() {
        var people=http.getForEntity("/api/people",String.class);
        assertEquals(503,people.getStatusCode().value());assertFalse(people.getBody().contains("password"));
        assertEquals(503,http.getForEntity("/api/people/health",String.class).getStatusCode().value());
        assertEquals(200,http.getForEntity("/auth/providers",String.class).getStatusCode().value());
        assertEquals(200,http.getForEntity("/health",String.class).getStatusCode().value());
    }
}

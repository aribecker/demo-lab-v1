package ariel.iteration2.weather.database;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties={"simulation.database-url=", "simulation.scheduling-enabled=false"})
class DatabaseExplorerBoundaryTest {
    @Autowired TestRestTemplate http;
    @Test void missingStorageFailsClearlyWithoutAffectingHealth() {
        var response=http.getForEntity("/api/database",String.class);
        assertEquals(503,response.getStatusCode().value());
        assertTrue(response.getBody().contains("database explorer is unavailable"));
        assertEquals("no-store",response.getHeaders().getCacheControl());
        assertFalse(response.getBody().contains("jdbc:"));
        assertEquals(200,http.getForEntity("/health",String.class).getStatusCode().value());
    }
    @Test void invalidPaginationAndWritesAreRejectedBeforeReadingStorage() {
        for(String query:new String[]{"limit=0","limit=51","offset=-1","offset=1000001","offset=oops"})
            assertEquals(400,http.getForEntity("/api/database/rows?schema=public&table=people&"+query,String.class).getStatusCode().value());
        assertEquals(405,http.postForEntity("/api/database",null,String.class).getStatusCode().value());
        assertEquals(405,http.postForEntity("/api/database/rows?schema=public&table=people",null,String.class).getStatusCode().value());
    }
}

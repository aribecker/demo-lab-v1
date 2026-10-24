package ariel.iteration2.weather.simulation;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={"simulation.database-url=", "simulation.scheduling-enabled=false"})
class SimulationBoundaryTest {
    @Autowired TestRestTemplate client;
    @Test void missingDatabaseDoesNotCreateVolatileSimulationOrBreakBackendHealth() {
        var response=client.getForEntity("/api/simulation",String.class);
        assertEquals(503,response.getStatusCode().value());
        assertTrue(response.getBody().contains("SIMULATION_STORAGE_UNAVAILABLE"));
        assertTrue(response.getHeaders().getCacheControl().contains("no-store"));
        assertEquals(200,client.getForEntity("/health",String.class).getStatusCode().value());
    }
}


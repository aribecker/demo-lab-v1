package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={
    "simulation.database-url=jdbc:h2:mem:rate-history-api;MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "simulation.scheduling-enabled=false"})
class RateQueryApiTest {
    @Autowired TestRestTemplate client;
    @Autowired SimulationStore store;
    @Test void historyHttpIsReadOnlyNoStoreAndPreservesExactDecimal() {
        Instant now=Instant.parse("2026-10-25T15:34:56.123456Z");
        long id=store.history().begin(now);store.history().complete(id,now,new BigDecimal("81234.123456789012"),200,null);
        long revision=store.read().controlRevision;
        var response=client.getForEntity("/api/simulation/rate-queries?limit=1",JsonNode.class);
        assertEquals(200,response.getStatusCode().value());assertTrue(response.getHeaders().getCacheControl().contains("no-store"));
        var row=response.getBody().path("queries").get(0);
        assertEquals("81234.123456789012",row.path("price").asText());assertEquals(now.toString(),row.path("requestedAt").asText());
        assertEquals(id,row.path("id").asLong());assertEquals(revision,store.read().controlRevision);
    }
    @Test void invalidPagingReturnsSafe400() {
        for(String query:new String[]{"limit=101","limit=0","before=-1","before=abc"}) {
            var r=client.getForEntity("/api/simulation/rate-queries?"+query,String.class);
            assertEquals(400,r.getStatusCode().value());assertFalse(r.getBody().contains("SQLException"));
        }
    }
    @Test void snapshotExposesLifetimeSummaryWithoutChangingSimulation() {
        long before=store.history().summary().total();
        var r=client.getForEntity("/api/simulation",JsonNode.class);
        assertEquals(200,r.getStatusCode().value());assertEquals(before,r.getBody().path("rateQueries").path("total").asLong());
        assertEquals(before,store.history().summary().total());
    }
}

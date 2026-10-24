package ariel.iteration2.weather.chat;

import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"chat.api-key=","chat.base-url=http://127.0.0.1:1","simulation.database-url=","simulation.scheduling-enabled=false"})
class ChatBoundaryTest {
    @Autowired TestRestTemplate http;
    @Test void missingKeyIsExplicitAndDoesNotBreakOtherDemos() {
        var catalog=http.getForEntity("/api/chat/models",String.class);
        assertEquals(200,catalog.getStatusCode().value());assertTrue(catalog.getBody().contains("\"configured\":false"));
        var reply=http.postForEntity("/api/chat",Map.of("model","openrouter/free","messages",List.of(Map.of("role","user","content","Hola"))),String.class);
        assertEquals(503,reply.getStatusCode().value());assertFalse(reply.getBody().contains("\"reply\""));
        assertEquals(200,http.getForEntity("/auth/providers",String.class).getStatusCode().value());
        assertEquals(503,http.getForEntity("/api/people",String.class).getStatusCode().value());
        assertEquals(200,http.getForEntity("/health",String.class).getStatusCode().value());
    }
}

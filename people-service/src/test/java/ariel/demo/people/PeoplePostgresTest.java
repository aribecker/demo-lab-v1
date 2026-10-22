package ariel.demo.people;

import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.assertj.core.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "PEOPLE_TEST_DB_URL", matches = ".+")
@ActiveProfiles("database")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PeoplePostgresTest {
    @DynamicPropertySource static void database(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> System.getenv("PEOPLE_TEST_DB_URL"));
        r.add("spring.datasource.username", () -> System.getenv().getOrDefault("PEOPLE_TEST_DB_USER", "postgres"));
        r.add("spring.datasource.password", () -> System.getenv().getOrDefault("PEOPLE_TEST_DB_PASSWORD", ""));
    }
    @Autowired TestRestTemplate http;
    @Autowired JdbcTemplate jdbc;
    @BeforeEach void clear() { jdbc.execute("TRUNCATE people RESTART IDENTITY"); }
    ResponseEntity<Map> add(String name, UUID id) {
        return http.postForEntity("/api/people", Map.of("name", name, "requestId", id.toString()), Map.class);
    }
    @Test void migratesOnceAndChecksRealPostgresReadiness() {
        assertThat(jdbc.queryForObject("SELECT count(*) FROM flyway_schema_history WHERE success = true", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT version()", String.class)).contains("PostgreSQL");
        assertThat(http.getForEntity("/health", String.class).getBody()).contains("PostgreSQL", "UP");
    }
    @Test void createsTrimsAndPersistsAcrossIndependentHttpReads() {
        var saved = add("  Ada Lovelace  ", UUID.randomUUID());
        assertThat(saved.getStatusCode().value()).isEqualTo(201);
        assertThat(saved.getBody()).containsEntry("name", "Ada Lovelace").containsKeys("id", "createdAt");
        assertThat(http.getForObject("/api/people", String.class)).contains("Ada Lovelace");
        assertThat(jdbc.queryForObject("SELECT name FROM people", String.class)).isEqualTo("Ada Lovelace");
    }
    @Test void idempotentRetryAndConflictPreventDuplicateWrites() {
        var id = UUID.randomUUID(); var first = add("Grace Hopper", id); var second = add("Grace Hopper", id);
        assertThat(second.getStatusCode().value()).isEqualTo(200);
        assertThat(second.getBody().get("id")).isEqualTo(first.getBody().get("id"));
        assertThat(add("Different", id).getStatusCode().value()).isEqualTo(409);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM people", Integer.class)).isEqualTo(1);
    }
    @Test void storesUnicodeApostrophesAndInjectionAsData() {
        for (String name : List.of("José O'Connor", "'); DROP TABLE people; --"))
            assertThat(add(name, UUID.randomUUID()).getStatusCode().value()).isEqualTo(201);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM people", Integer.class)).isEqualTo(2);
        assertThat(http.getForObject("/api/people", String.class)).contains("José O'Connor", "DROP TABLE");
    }
    @Test void validatesRequestsAndEnforcesDatabaseConstraint() {
        for (String name : List.of("  ", "x".repeat(101))) assertThat(add(name, UUID.randomUUID()).getStatusCode().value()).isEqualTo(400);
        assertThat(http.postForEntity("/api/people", Map.of("name", "Ada", "requestId", "invalid"), String.class).getStatusCode().value()).isEqualTo(400);
        assertThat(http.getForEntity("/api/people?limit=101", String.class).getStatusCode().value()).isEqualTo(400);
        assertThat(http.getForEntity("/api/people?before=0", String.class).getStatusCode().value()).isEqualTo(400);
        assertThatThrownBy(() -> jdbc.update("INSERT INTO people(name,request_id) VALUES (?,?)", " ", UUID.randomUUID())).isInstanceOf(org.springframework.dao.DataAccessException.class);
    }
    @Test void paginatesNewestFirstWithoutRepeatingPeople() {
        add("First", UUID.randomUUID()); add("Second", UUID.randomUUID()); add("Third", UUID.randomUUID());
        var page = http.getForObject("/api/people?limit=2", Map.class);
        var rows = (List<Map<String, Object>>) page.get("people");
        assertThat(rows).extracting(p -> p.get("name")).containsExactly("Third", "Second");
        var tail = http.getForObject("/api/people?limit=2&before=" + page.get("nextCursor"), Map.class);
        assertThat(((List<Map<String, Object>>) tail.get("people"))).extracting(p -> p.get("name")).containsExactly("First");
        assertThat(tail.get("nextCursor")).isNull();
    }
    @Test void allowsSameNameAndRestrictsCors() {
        add("Alex", UUID.randomUUID()); add("Alex", UUID.randomUUID());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM people", Integer.class)).isEqualTo(2);
        var headers = new HttpHeaders(); headers.setOrigin("https://untrusted.example"); headers.setAccessControlRequestMethod(HttpMethod.POST);
        assertThat(http.exchange("/api/people", HttpMethod.OPTIONS, new HttpEntity<>(headers), String.class).getStatusCode().value()).isEqualTo(403);
        headers.setOrigin("http://localhost:5173");
        assertThat(http.exchange("/api/people", HttpMethod.OPTIONS, new HttpEntity<>(headers), String.class).getHeaders().getAccessControlAllowOrigin()).isEqualTo("http://localhost:5173");
    }
}

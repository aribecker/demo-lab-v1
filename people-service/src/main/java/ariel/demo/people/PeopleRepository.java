package ariel.demo.people;
import org.springframework.context.annotation.Profile;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Profile("database")
class PeopleRepository {
    record Person(long id, String name, Instant createdAt) {}
    record Page(List<Person> people, Long nextCursor) {}
    record Saved(Person person, boolean created) {}
    private final JdbcTemplate jdbc;
    PeopleRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    private Person row(ResultSet rs, int index) throws SQLException {
        return new Person(rs.getLong("id"), rs.getString("name"), rs.getTimestamp("created_at").toInstant());
    }
    @Transactional
    public Saved add(String name, UUID requestId) {
        var inserted = jdbc.query("INSERT INTO people(name, request_id) VALUES (?, ?) ON CONFLICT (request_id) DO NOTHING RETURNING id, name, created_at", this::row, name, requestId);
        if (!inserted.isEmpty()) return new Saved(inserted.get(0), true);
        var prior = jdbc.queryForObject("SELECT id, name, created_at FROM people WHERE request_id = ?", this::row, requestId);
        if (!prior.name().equals(name)) throw new RequestConflict();
        return new Saved(prior, false);
    }
    @Transactional(readOnly = true)
    public Page list(Long before, int limit) {
        var rows = before == null
                ? jdbc.query("SELECT id, name, created_at FROM people ORDER BY id DESC LIMIT ?", this::row, limit + 1)
                : jdbc.query("SELECT id, name, created_at FROM people WHERE id < ? ORDER BY id DESC LIMIT ?", this::row, before, limit + 1);
        boolean more = rows.size() > limit;
        var page = List.copyOf(rows.subList(0, Math.min(rows.size(), limit)));
        return new Page(page, more ? page.get(page.size() - 1).id() : null);
    }
    static class RequestConflict extends RuntimeException {}
}

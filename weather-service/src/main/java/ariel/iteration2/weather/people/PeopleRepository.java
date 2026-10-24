package ariel.iteration2.weather.people;

import ariel.iteration2.weather.database.DatabaseConnections;
import com.zaxxer.hikari.*;
import jakarta.annotation.PreDestroy;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.support.TransactionTemplate;

@Repository
public class PeopleRepository {
    public record Person(long id, String name, Instant createdAt) {}
    public record Page(List<Person> people, Long nextCursor) {}
    public record Saved(Person person, boolean created) {}
    private final DatabaseConnections connections;
    private final HikariDataSource pool;
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaction;
    private volatile boolean ready;

    public PeopleRepository(@Value("${simulation.database-url:}") String connection) {
        connections = new DatabaseConnections(connection);
        var config = new HikariConfig();
        config.setPoolName("people-shared-db"); config.setMaximumPoolSize(3); config.setMinimumIdle(0);
        config.setConnectionTimeout(10000); config.setInitializationFailTimeout(-1);
        config.setDataSource(new AbstractDataSource() {
            public Connection getConnection() throws SQLException { return connections.open(); }
            public Connection getConnection(String user, String password) throws SQLException { return getConnection(); }
        });
        pool = new HikariDataSource(config); jdbc = new JdbcTemplate(pool);
        transaction = new TransactionTemplate(new DataSourceTransactionManager(pool));
    }
    public synchronized void initialize() {
        if (ready) return;
        if (!connections.configured()) throw new Unavailable();
        try {
            Flyway.configure().dataSource(pool).locations("classpath:db/people-migration")
                .defaultSchema("public").load().migrate();
            ready = true;
        } catch (RuntimeException failure) { throw new Unavailable(); }
    }
    private Person row(ResultSet rs, int index) throws SQLException {
        return new Person(rs.getLong("id"), rs.getString("name"), rs.getTimestamp("created_at").toInstant());
    }
    public Saved add(String name, UUID requestId) {
        initialize();
        return transaction.execute(status -> {
            var inserted = jdbc.query("INSERT INTO public.people(name, request_id) VALUES (?, ?) ON CONFLICT (request_id) DO NOTHING RETURNING id, name, created_at", this::row, name, requestId);
            if (!inserted.isEmpty()) return new Saved(inserted.get(0), true);
            var prior = jdbc.queryForObject("SELECT id, name, created_at FROM public.people WHERE request_id = ?", this::row, requestId);
            if (!prior.name().equals(name)) throw new Conflict();
            return new Saved(prior, false);
        });
    }
    public Page list(Long before, int limit) {
        initialize();
        var rows = before == null
            ? jdbc.query("SELECT id, name, created_at FROM public.people ORDER BY id DESC LIMIT ?", this::row, limit + 1)
            : jdbc.query("SELECT id, name, created_at FROM public.people WHERE id < ? ORDER BY id DESC LIMIT ?", this::row, before, limit + 1);
        var page = List.copyOf(rows.subList(0, Math.min(rows.size(), limit)));
        return new Page(page, rows.size() > limit ? page.get(page.size()-1).id() : null);
    }
    public void health() { initialize(); jdbc.queryForObject("SELECT 1", Integer.class); }
    @PreDestroy public void close() { pool.close(); }
    public static class Conflict extends RuntimeException {}
    public static class Unavailable extends RuntimeException {}
}

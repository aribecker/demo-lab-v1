package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.Properties;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SimulationStore {
    private static final Logger LOG = LoggerFactory.getLogger(SimulationStore.class);
    private final String url;
    private final ObjectMapper json;
    private final Properties properties = new Properties();
    private volatile boolean ready;
    public SimulationStore(String connection, ObjectMapper json) {
        this.json = json;
        if (connection == null || connection.isBlank()) { url = ""; return; }
        if (connection.startsWith("jdbc:")) url = connection;
        else {
            URI uri;
            try { uri = URI.create(connection); }
            catch (Exception invalid) { throw new IllegalArgumentException("Invalid simulation database configuration."); }
            if (!uri.getScheme().equals("postgres") && !uri.getScheme().equals("postgresql")) throw new IllegalArgumentException("Invalid database scheme.");
            url = "jdbc:postgresql://" + uri.getRawAuthority().substring(uri.getRawAuthority().lastIndexOf('@') + 1)
                + uri.getRawPath() + (uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery());
            if (uri.getRawUserInfo() != null) {
                String[] credentials = uri.getRawUserInfo().split(":",2);
                properties.setProperty("user", decode(credentials[0]));
                if (credentials.length == 2) properties.setProperty("password", decode(credentials[1]));
            }
        }
        if (url.startsWith("jdbc:postgresql:")) {
            properties.setProperty("connectTimeout","5"); properties.setProperty("socketTimeout","10");
        }
    }
    private static String decode(String value) { return URLDecoder.decode(value.replace("+","%2B"), StandardCharsets.UTF_8); }
    public boolean configured() { return !url.isEmpty(); }
    public synchronized void initialize() {
        if (ready) return;
        if (!configured()) throw new StorageUnavailable();
        try (Connection c = connect(); var statement = c.createStatement()) {
            String schema;
            try (var input = getClass().getResourceAsStream("/db/shared-simulation.sql")) { schema = new String(input.readAllBytes(),StandardCharsets.UTF_8); }
            for (String sql : schema.split(";")) if (!sql.isBlank()) statement.execute(sql);
            try (var insert = c.prepareStatement("INSERT INTO bitcoin_shared.simulation_state(state_id,document) SELECT 1,? WHERE NOT EXISTS (SELECT 1 FROM bitcoin_shared.simulation_state WHERE state_id=1)")) {
                insert.setString(1,json.writeValueAsString(new SharedState()));
                try { insert.executeUpdate(); } catch (SQLException race) { if (!"23505".equals(race.getSQLState())) throw race; }
            }
            ready = true;
        } catch (Exception failure) {
            LOG.warn("Simulation storage initialization failed (SQL state: {}).", failure instanceof SQLException sql ? sql.getSQLState() : "unavailable");
            throw new StorageUnavailable();
        }
    }
    private Connection connect() throws SQLException { return DriverManager.getConnection(url, properties); }
    public SharedState read() {
        if (!ready) throw new StorageUnavailable();
        try (Connection c = connect(); var statement = c.createStatement(); var rows = statement.executeQuery("SELECT document FROM bitcoin_shared.simulation_state WHERE state_id=1")) {
            if (!rows.next()) throw new StorageUnavailable();
            return json.readValue(rows.getString(1),SharedState.class);
        } catch (Exception failure) { throw new StorageUnavailable(); }
    }
    public <T> T locked(Function<SharedState,T> action) {
        if (!ready) throw new StorageUnavailable();
        try (Connection c = connect()) {
            c.setAutoCommit(false);
            try {
                if (c.getMetaData().getDatabaseProductName().equals("PostgreSQL")) {
                    try (var timeout = c.createStatement()) { timeout.execute("SET LOCAL lock_timeout = '8s'"); }
                }
                SharedState state;
                try (var statement = c.createStatement(); var rows = statement.executeQuery("SELECT document FROM bitcoin_shared.simulation_state WHERE state_id=1 FOR UPDATE")) {
                    if (!rows.next()) throw new StorageUnavailable();
                    state = json.readValue(rows.getString(1),SharedState.class);
                }
                T result = action.apply(state);
                try (var save = c.prepareStatement("UPDATE bitcoin_shared.simulation_state SET document=? WHERE state_id=1")) {
                    save.setString(1,json.writeValueAsString(state)); save.executeUpdate();
                }
                c.commit(); return result;
            } catch (Exception failure) {
                c.rollback();
                if (failure instanceof IllegalArgumentException bad) throw bad;
                if (failure instanceof SimulationService.Conflict conflict) throw conflict;
                throw new StorageUnavailable();
            }
        } catch (SQLException failure) { throw new StorageUnavailable(); }
    }
    public static class StorageUnavailable extends RuntimeException {
        public StorageUnavailable() { super("Shared simulation storage is unavailable. No local simulation was created."); }
    }
}


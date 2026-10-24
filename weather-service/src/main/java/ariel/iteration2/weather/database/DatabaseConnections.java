package ariel.iteration2.weather.database;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.Properties;

/** Shared secret-safe connection parsing for the simulator and People. */
public final class DatabaseConnections {
    private final String url;
    private final Properties properties = new Properties();
    public DatabaseConnections(String connection) {
        if (connection == null || connection.isBlank()) { url = ""; return; }
        if (connection.startsWith("jdbc:")) url = connection;
        else {
            URI uri;
            try { uri = URI.create(connection); }
            catch (Exception invalid) { throw new IllegalArgumentException("Invalid database configuration."); }
            if (!"postgres".equals(uri.getScheme()) && !"postgresql".equals(uri.getScheme())) throw new IllegalArgumentException("Invalid database scheme.");
            url = "jdbc:postgresql://" + uri.getRawAuthority().substring(uri.getRawAuthority().lastIndexOf('@') + 1)
                + uri.getRawPath() + (uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery());
            if (uri.getRawUserInfo() != null) {
                String[] credentials = uri.getRawUserInfo().split(":", 2);
                properties.setProperty("user", decode(credentials[0]));
                if (credentials.length == 2) properties.setProperty("password", decode(credentials[1]));
            }
        }
        if (url.startsWith("jdbc:postgresql:")) {
            properties.setProperty("connectTimeout", "5"); properties.setProperty("socketTimeout", "10");
        }
    }
    private static String decode(String value) { return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8); }
    public boolean configured() { return !url.isEmpty(); }
    public Connection open() throws SQLException {
        if (!configured()) throw new SQLException("Database is not configured.", "08001");
        return DriverManager.getConnection(url, properties);
    }
}

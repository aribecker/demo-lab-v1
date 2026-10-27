package ariel.iteration2.weather.auth;

import ariel.iteration2.weather.database.DatabaseConnections;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.*;
import java.time.Instant;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Durable opaque-token hashes. No credential or raw provider token is persisted. */
@Component
public class AuthSessionStore {
    private final DatabaseConnections connections;
    private final String databaseUrl;
    String databaseUrl(){return databaseUrl;}
    private final ObjectMapper json;
    private volatile boolean ready;
    public AuthSessionStore(@Value("${auth.database-url:}") String connection,ObjectMapper json) {
        this.databaseUrl=connection;this.connections=new DatabaseConnections(connection);this.json=json;
    }
    private synchronized void initialize() {
        if(ready)return;
        try {
            var source=new org.springframework.jdbc.datasource.AbstractDataSource() {
                public Connection getConnection()throws SQLException{return connections.open();}
                public Connection getConnection(String user,String password)throws SQLException{return getConnection();}
            };
            String schema;
            try(var c=connections.open()){schema=c.getMetaData().getDatabaseProductName().equals("H2")?"AUTH_PRIVATE":"auth_private";}
            Flyway.configure().dataSource(source).schemas(schema).defaultSchema(schema).table("session_schema_history")
                .locations("classpath:db/auth-migration").load().migrate();
            ready=true;
        }catch(Exception failure){throw new Unavailable();}
    }
    public void save(String hash,DemoSessions.Profile profile,Instant createdAt,Instant expiresAt) {
        initialize();
        try(var c=connections.open()) {
            c.setAutoCommit(false);
            try {
                try(var cleanup=c.prepareStatement("DELETE FROM auth_private.application_sessions WHERE expires_at<=?")) {
                    cleanup.setTimestamp(1,Timestamp.from(createdAt));cleanup.executeUpdate();
                }
                try(var insert=c.prepareStatement("INSERT INTO auth_private.application_sessions(token_hash,profile,created_at,expires_at) VALUES(?,?,?,?)")) {
                    insert.setString(1,hash);insert.setString(2,json.writeValueAsString(profile));
                    insert.setTimestamp(3,Timestamp.from(createdAt));insert.setTimestamp(4,Timestamp.from(expiresAt));insert.executeUpdate();
                }
                c.commit();
            }catch(Exception failure){c.rollback();throw new Unavailable();}
        }catch(Exception failure){throw new Unavailable();}
    }
    public DemoSessions.Session find(String hash,Instant now) {
        initialize();
        try(var c=connections.open();var query=c.prepareStatement("SELECT profile,expires_at FROM auth_private.application_sessions WHERE token_hash=? AND expires_at>? AND revoked_at IS NULL")) {
            query.setString(1,hash);query.setTimestamp(2,Timestamp.from(now));
            try(var r=query.executeQuery()) {
                return r.next()?new DemoSessions.Session(json.readValue(r.getString(1),DemoSessions.Profile.class),r.getTimestamp(2).toInstant()):null;
            }
        }catch(Exception failure){throw new Unavailable();}
    }
    public void revoke(String hash,Instant now) {
        initialize();
        try(var c=connections.open();var query=c.prepareStatement("UPDATE auth_private.application_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL")) {
            query.setTimestamp(1,Timestamp.from(now));query.setString(2,hash);query.executeUpdate();
        }catch(Exception failure){throw new Unavailable();}
    }
    public static class Unavailable extends RuntimeException {
        public Unavailable(){super("Login storage is temporarily unavailable. Please retry.");}
    }
}

package ariel.iteration2.weather.simulation;

import ariel.iteration2.weather.database.DatabaseConnections;
import java.math.BigDecimal;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import org.flywaydb.core.Flyway;
import org.springframework.jdbc.datasource.AbstractDataSource;

/** Independent audit commits survive a rollback/restart of the simulation document. */
public final class RateQueryHistory {
    private final DatabaseConnections connections;
    private volatile boolean ready;
    public record Summary(long total,long successful,long failed,long inProgress,Instant firstRequestedAt,Instant lastRequestedAt) {}
    public record Query(long id,Instant requestedAt,Instant completedAt,String provider,String symbol,
        String status,String price,Integer httpStatus,String errorCode) {}
    public record Page(List<Query> queries,Long nextCursor,Summary summary) {}
    public record Period(long id,Instant from,Instant to,long readingCount) {}
    public record PeriodPage(List<Period> periods,Long nextCursor,long totalPeriods,long successfulReadings) {}
    private static final String PERIODS = "WITH ordered AS (SELECT id,requested_at,LAG(requested_at) OVER (ORDER BY requested_at,id) AS previous_at FROM bitcoin_shared.rate_queries WHERE status='SUCCESS'), "
        + "marked AS (SELECT id,requested_at,CASE WHEN previous_at IS NULL OR requested_at >= previous_at + INTERVAL '1' MINUTE THEN 1 ELSE 0 END AS boundary FROM ordered), "
        + "grouped AS (SELECT requested_at,SUM(boundary) OVER (ORDER BY requested_at,id ROWS UNBOUNDED PRECEDING) AS period_id FROM marked), "
        + "periods AS (SELECT period_id,MIN(requested_at) AS period_from,MAX(requested_at) AS period_to,COUNT(*) AS reading_count FROM grouped GROUP BY period_id) ";
    public RateQueryHistory(DatabaseConnections connections) { this.connections=connections; }
    public synchronized void initialize() {
        if(ready) return;
        try {
            var source=new AbstractDataSource() {
                public Connection getConnection() throws SQLException { return connections.open(); }
                public Connection getConnection(String user,String password) throws SQLException { return getConnection(); }
            };
            String schema;
            try(var c=connections.open()) { schema=c.getMetaData().getDatabaseProductName().equals("H2")?"BITCOIN_SHARED":"bitcoin_shared"; }
            Flyway.configure().dataSource(source).locations("classpath:db/rate-migration")
                .schemas(schema).defaultSchema(schema).table("rate_query_schema_history")
                .baselineOnMigrate(true).baselineVersion("0").load().migrate();
            ready=true;
        } catch(RuntimeException | SQLException failure) { throw new SimulationStore.StorageUnavailable(); }
    }
    public long begin(Instant now) {
        requireReady();
        try(var c=connections.open();var st=c.prepareStatement(
            "INSERT INTO bitcoin_shared.rate_queries(requested_at,status) VALUES (?, 'IN_PROGRESS')",Statement.RETURN_GENERATED_KEYS)) {
            st.setQueryTimeout(10);st.setTimestamp(1,Timestamp.from(now));st.executeUpdate();
            try(var keys=st.getGeneratedKeys()){if(!keys.next())throw new SQLException("No audit id");return keys.getLong(1);}
        }catch(SQLException failure){throw new SimulationStore.StorageUnavailable();}
    }
    public void complete(long id,Instant now,BigDecimal price,Integer httpStatus,String errorCode) {
        requireReady();
        if(errorCode!=null && !Set.of("HTTP_ERROR","INVALID_RESPONSE","TRANSPORT_ERROR","INTERRUPTED").contains(errorCode))
            throw new IllegalArgumentException("Unknown safe audit error category.");
        try(var c=connections.open();var st=c.prepareStatement("UPDATE bitcoin_shared.rate_queries SET completed_at=?,status=?,price=?,http_status=?,error_code=? WHERE id=? AND status='IN_PROGRESS'")) {
            st.setQueryTimeout(10);st.setTimestamp(1,Timestamp.from(now));st.setString(2,errorCode==null?"SUCCESS":"ERROR");
            st.setBigDecimal(3,price);st.setObject(4,httpStatus);st.setString(5,errorCode);st.setLong(6,id);
            if(st.executeUpdate()!=1)throw new SQLException("Audit completion conflict");
        }catch(SQLException failure){throw new SimulationStore.StorageUnavailable();}
    }
    public Summary summary() {
        requireReady();
        try(var c=connections.open()) {return summary(c);}catch(SQLException failure){throw new SimulationStore.StorageUnavailable();}
    }
    private Summary summary(Connection c) throws SQLException {
        try(var st=c.createStatement()) {
            st.setQueryTimeout(10);
            try(var r=st.executeQuery("SELECT COUNT(*), COALESCE(SUM(CASE WHEN status='SUCCESS' THEN 1 ELSE 0 END),0), COALESCE(SUM(CASE WHEN status='ERROR' THEN 1 ELSE 0 END),0), COALESCE(SUM(CASE WHEN status='IN_PROGRESS' THEN 1 ELSE 0 END),0), MIN(requested_at), MAX(requested_at) FROM bitcoin_shared.rate_queries")) {
                r.next();return new Summary(r.getLong(1),r.getLong(2),r.getLong(3),r.getLong(4),instant(r,5),instant(r,6));
            }
        }
    }
    public Page page(Long before,int limit) {
        if(before!=null && before<=0 || limit<1 || limit>100)throw new IllegalArgumentException("Use a positive cursor and page size from 1 to 100.");
        requireReady();
        try(var c=connections.open()) {
            // One read snapshot keeps rows and counts coherent while the scheduler appends.
            c.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);c.setReadOnly(true);c.setAutoCommit(false);
            try(var st=c.prepareStatement("SELECT id,requested_at,completed_at,provider,symbol,status,price,http_status,error_code FROM bitcoin_shared.rate_queries"+(before==null?"":" WHERE id < ?")+" ORDER BY id DESC LIMIT ?")) {
                st.setQueryTimeout(10);int index=1;if(before!=null)st.setLong(index++,before);st.setInt(index,limit+1);
                List<Query> rows=new ArrayList<>();
                try(var r=st.executeQuery()){while(r.next()){
                    BigDecimal value=r.getBigDecimal(7);Integer http=(Integer)r.getObject(8);
                    rows.add(new Query(r.getLong(1),instant(r,2),instant(r,3),r.getString(4),r.getString(5),r.getString(6),value==null?null:value.stripTrailingZeros().toPlainString(),http,r.getString(9)));
                }}
                boolean more=rows.size()>limit;if(more)rows.remove(rows.size()-1);
                Summary totals=summary(c);c.commit();return new Page(rows,more?rows.get(rows.size()-1).id():null,totals);
            }
        }catch(SQLException failure){throw new SimulationStore.StorageUnavailable();}
    }
    private static Instant instant(ResultSet r,int index) throws SQLException {Timestamp time=r.getTimestamp(index);return time==null?null:time.toInstant();}
    public PeriodPage periods(Long before,int limit) {
        if(before!=null && before<=0 || limit<1 || limit>100)throw new IllegalArgumentException("Use a positive cursor and page size from 1 to 100.");
        requireReady();
        try(var c=connections.open()) {
            c.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);c.setReadOnly(true);c.setAutoCommit(false);
            long total,count;
            try(var st=c.createStatement()) {
                st.setQueryTimeout(10);
                try(var r=st.executeQuery(PERIODS+"SELECT COUNT(*),COALESCE(SUM(reading_count),0) FROM periods")) { r.next();total=r.getLong(1);count=r.getLong(2); }
            }
            List<Period> rows=new ArrayList<>();
            try(var st=c.prepareStatement(PERIODS+"SELECT period_id,period_from,period_to,reading_count FROM periods"+(before==null?"":" WHERE period_id < ?")+" ORDER BY period_id DESC LIMIT ?")) {
                st.setQueryTimeout(10);int i=1;if(before!=null)st.setLong(i++,before);st.setInt(i,limit+1);
                try(var r=st.executeQuery()){while(r.next())rows.add(new Period(r.getLong(1),instant(r,2),instant(r,3),r.getLong(4)));}
            }
            boolean more=rows.size()>limit;if(more)rows.remove(rows.size()-1);c.commit();
            return new PeriodPage(rows,more?rows.get(rows.size()-1).id():null,total,count);
        }catch(SQLException failure){throw new SimulationStore.StorageUnavailable();}
    }
    private void requireReady(){if(!ready)throw new SimulationStore.StorageUnavailable();}
}

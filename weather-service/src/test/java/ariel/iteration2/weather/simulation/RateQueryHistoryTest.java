package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class RateQueryHistoryTest {
    String database;SimulationStore store;RateQueryHistory history;
    final Instant now=Instant.parse("2026-10-25T15:34:56.123456Z");
    @BeforeEach void setup() throws Exception {
        database=System.getenv("SIMULATION_TEST_DATABASE_URL");
        if(database==null||database.isBlank())database="jdbc:h2:mem:"+UUID.randomUUID()+";MODE=PostgreSQL;DB_CLOSE_DELAY=-1";
        else if(!database.matches("jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/.*"))throw new IllegalArgumentException("Disposable loopback test database required.");
        else try(var c=DriverManager.getConnection(database);var st=c.createStatement()) {
            st.execute("DROP SCHEMA IF EXISTS bitcoin_shared CASCADE");
        }
        store=new SimulationStore(database,new ObjectMapper());store.initialize();history=store.history();
    }
    @Test void incompleteAttemptAndResultSurviveStateRollback() {
        long id=history.begin(now);
        assertEquals(1,history.summary().inProgress());
        assertThrows(SimulationStore.StorageUnavailable.class,()->store.locked(s->{
            history.complete(id,now.plusMillis(123),new BigDecimal("81000.123456789012"),200,null);
            s.simulation.usdt=999;throw new RuntimeException("State commit failed");
        }));
        assertEquals(0,store.read().simulation.usdt);
        var row=history.page(null,25).queries().get(0);
        assertEquals("SUCCESS",row.status());assertEquals("81000.123456789012",row.price());
        assertEquals(now,row.requestedAt());assertEquals(now.plusMillis(123),row.completedAt());
    }
    @Test void pagesAreNewestFirstAndStableWhenNewRowsArrive() {
        for(int i=0;i<5;i++)history.begin(now.plusSeconds(i));
        var first=history.page(null,2);assertEquals(5,first.summary().total());
        assertTrue(first.queries().get(0).id()>first.queries().get(1).id());
        history.begin(now.plusSeconds(10));
        var second=history.page(first.nextCursor(),2);
        assertTrue(second.queries().get(0).id()<first.nextCursor());
        var last=history.page(second.nextCursor(),2);assertEquals(1,last.queries().size());assertNull(last.nextCursor());
        assertEquals(6,last.summary().total());
        assertThrows(IllegalArgumentException.class,()->history.page(0L,25));
        assertThrows(IllegalArgumentException.class,()->history.page(null,101));
    }
    @Test void migrationIsVersionedAndPreservesLegacyDocument() throws Exception {
        store.locked(s->{s.simulation.usdt=123;s.running=false;return s;});
        String checksum;
        try(var c=DriverManager.getConnection(database);var st=c.createStatement();var r=st.executeQuery("SELECT \"checksum\" FROM bitcoin_shared.\"rate_query_schema_history\" WHERE \"version\"='1'")) {
            assertTrue(r.next());checksum=r.getString(1);assertNotNull(checksum);
        }
        var restarted=new SimulationStore(database,new ObjectMapper());restarted.initialize();
        assertEquals(123,restarted.read().simulation.usdt);assertFalse(restarted.read().running);
        try(var c=DriverManager.getConnection(database);var st=c.createStatement();var r=st.executeQuery("SELECT COUNT(*),MAX(\"checksum\") FROM bitcoin_shared.\"rate_query_schema_history\" WHERE \"version\"='1'")) {
            r.next();assertEquals(1,r.getInt(1));assertEquals(checksum,r.getString(2));
        }
    }
    @Test void databaseContractTypesIndexesAndConstraintsAreEnforced() throws Exception {
        try(var c=DriverManager.getConnection(database)) {
            var md=c.getMetaData();String schema=c.getMetaData().getDatabaseProductName().equals("PostgreSQL")?"bitcoin_shared":"BITCOIN_SHARED";
            String table=schema.equals("bitcoin_shared")?"rate_queries":"RATE_QUERIES";
            boolean price=false,timestamp=false,index=false;
            try(var cols=md.getColumns(null,schema,table,null)){while(cols.next()) {
                if(cols.getString("COLUMN_NAME").equalsIgnoreCase("price")){price=true;assertEquals(30,cols.getInt("COLUMN_SIZE"));assertEquals(12,cols.getInt("DECIMAL_DIGITS"));}
                if(cols.getString("COLUMN_NAME").equalsIgnoreCase("requested_at")){timestamp=true;assertTrue(cols.getString("TYPE_NAME").toLowerCase().contains("time"));}
            }}
            try(var indexes=md.getIndexInfo(null,schema,table,false,false)){while(indexes.next())if("rate_queries_requested_at_idx".equalsIgnoreCase(indexes.getString("INDEX_NAME")))index=true;}
            assertTrue(price&&timestamp&&index);
            List<String> legacyColumns=new ArrayList<>();
            try(var cols=md.getColumns(null,schema,schema.equals("bitcoin_shared")?"simulation_state":"SIMULATION_STATE",null)){
                while(cols.next())legacyColumns.add(cols.getString("COLUMN_NAME").toLowerCase());
            }
            assertEquals(List.of("state_id","document"),legacyColumns);
            for(String values:List.of("'SUCCESS',NULL,NULL","'ERROR',NULL,NULL","'IN_PROGRESS',1,NULL","'BOGUS',NULL,NULL")) {
                try(var st=c.createStatement()){assertThrows(SQLException.class,()->st.executeUpdate("INSERT INTO bitcoin_shared.rate_queries(requested_at,status,price,error_code) VALUES (CURRENT_TIMESTAMP,"+values+")"));}
            }
        }
    }
    @Test void completionIsSingleUseAndSafeCategoriesOnly() {
        long id=history.begin(now);history.complete(id,now,null,500,"HTTP_ERROR");
        assertThrows(SimulationStore.StorageUnavailable.class,()->history.complete(id,now,null,500,"HTTP_ERROR"));
        assertThrows(IllegalArgumentException.class,()->history.complete(id,now,null,null,"secret/raw exception"));
        assertEquals(1,history.summary().failed());assertEquals(0,history.summary().successful());
    }
}

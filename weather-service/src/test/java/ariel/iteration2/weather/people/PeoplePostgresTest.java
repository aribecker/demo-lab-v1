package ariel.iteration2.weather.people;

import ariel.iteration2.weather.database.DatabaseConnections;
import java.sql.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named="SIMULATION_TEST_DATABASE_URL",matches=".+")
class PeoplePostgresTest {
    static String admin, url, database;
    static PeopleRepository people;
    @BeforeAll static void createIsolatedDatabase() throws Exception {
        admin=System.getenv("SIMULATION_TEST_DATABASE_URL");
        if (!admin.matches("jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/.*")) throw new IllegalArgumentException("Only disposable loopback PostgreSQL is permitted.");
        database="people_test_"+UUID.randomUUID().toString().replace("-","");
        try(var c=DriverManager.getConnection(admin);var st=c.createStatement()){st.execute("CREATE DATABASE "+database);}
        url=admin.replaceFirst("/[^/?]+(?=\\?|$)","/"+database);
        people=new PeopleRepository(url);people.initialize();
    }
    @AfterAll static void cleanUp() throws Exception {
        if(people!=null)people.close();
        if(database!=null)try(var c=DriverManager.getConnection(admin);var st=c.createStatement()){st.execute("DROP DATABASE "+database+" WITH (FORCE)");}
    }
    @BeforeEach void clearDisposableRows() throws Exception {
        try(var c=DriverManager.getConnection(url);var st=c.createStatement()){st.execute("TRUNCATE public.people RESTART IDENTITY");}
    }
    @Test void createsListsPaginatesAndHandlesSafeRetries() {
        UUID id=UUID.randomUUID();var one=people.add("Ada Lovelace",id);assertTrue(one.created());
        assertFalse(people.add("Ada Lovelace",id).created());
        assertThrows(PeopleRepository.Conflict.class,()->people.add("Different",id));
        var two=people.add("O'Connor — 李",UUID.randomUUID());
        var page=people.list(null,1);assertEquals(two.person().id(),page.people().get(0).id());
        assertNotNull(page.nextCursor());assertEquals(one.person().id(),people.list(page.nextCursor(),1).people().get(0).id());
    }
    @Test void preservesExistingRowsAndFlywayHistoryAcrossRestart() throws Exception {
        var saved=people.add("Existing sample",UUID.randomUUID()).person();
        people.close();people=new PeopleRepository(url);people.initialize();
        assertEquals(saved,people.list(null,50).people().get(0));
        try(var c=new DatabaseConnections(url).open();var st=c.createStatement();var rs=st.executeQuery("SELECT count(*) FROM public.flyway_schema_history WHERE success")) {
            assertTrue(rs.next());assertEquals(1,rs.getInt(1));
        }
    }
    @Test void parameterizedSqlKeepsSqlLikeNamesAsData() {
        String name="Robert'); DROP TABLE people;--";
        people.add(name,UUID.randomUUID());assertEquals(name,people.list(null,50).people().get(0).name());
        people.add("Still exists",UUID.randomUUID());assertEquals(2,people.list(null,50).people().size());
    }
}

package ariel.iteration2.weather.database;

import java.sql.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named="SIMULATION_TEST_DATABASE_URL",matches=".+")
class DatabaseExplorerPostgresTest {
    static String admin,url,database,role;
    static DatabaseExplorerRepository explorer,limited;
    @BeforeAll static void fixture() throws Exception {
        admin=System.getenv("SIMULATION_TEST_DATABASE_URL");
        if(!admin.matches("jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/.*"))throw new IllegalArgumentException("Only disposable loopback PostgreSQL is permitted.");
        String suffix=UUID.randomUUID().toString().replace("-","");database="explorer_test_"+suffix;role="explorer_role_"+suffix;
        try(var c=DriverManager.getConnection(admin);var st=c.createStatement()) {
            st.execute("CREATE DATABASE "+database);st.execute("CREATE ROLE "+role+" LOGIN");
        }
        url=admin.replaceFirst("/[^/?]+(?=\\?|$)","/"+database);
        try(var c=DriverManager.getConnection(url);var st=c.createStatement()) {
            st.execute("CREATE SCHEMA module_a; CREATE SCHEMA module_b");
            st.execute("CREATE TABLE module_a.people (id bigint PRIMARY KEY,name text,note text,payload jsonb,empty_value text)");
            st.execute("INSERT INTO module_a.people VALUES (2,'Grace','second','{\"n\":2}',''),(1,'Ada',NULL,'{\"n\":1}',''),(10,'Ten',NULL,'{}','')");
            st.execute("CREATE TABLE module_b.\"Odd\"\"Table\" (number integer PRIMARY KEY, value text)");
            st.execute("INSERT INTO module_b.\"Odd\"\"Table\" VALUES (9,repeat('x',70000))");
            st.execute("CREATE TABLE module_b.no_key (label text)");
            st.execute("CREATE TABLE public.empty_table (id integer PRIMARY KEY)");
            st.execute("CREATE VIEW module_a.hidden_view AS SELECT * FROM module_a.people");
            st.execute("GRANT USAGE ON SCHEMA module_a TO "+role+"; GRANT SELECT ON module_a.people TO "+role);
        }
        explorer=new DatabaseExplorerRepository(url);
        String restricted=url.contains("user=")?url.replaceAll("user=[^&]+","user="+role):url+(url.contains("?")?"&":"?")+"user="+role;
        limited=new DatabaseExplorerRepository(restricted);
    }
    @AfterAll static void cleanup() throws Exception {
        if(database!=null)try(var c=DriverManager.getConnection(admin);var st=c.createStatement()) {
            st.execute("DROP DATABASE "+database+" WITH (FORCE)");if(role!=null)st.execute("DROP ROLE "+role);
        }
    }
    @Test void catalogGroupsActualSchemasAndExcludesSystemSchemasAndViews() {
        var catalog=explorer.catalog();assertEquals(database,catalog.database());
        assertEquals(List.of("module_a","module_b","public"),catalog.schemas().stream().map(DatabaseExplorerRepository.Schema::name).toList());
        assertEquals(List.of("people"),catalog.schemas().get(0).tables().stream().map(DatabaseExplorerRepository.Table::name).toList());
        var restricted=limited.catalog();assertEquals(1,restricted.schemas().size());assertEquals("module_a",restricted.schemas().get(0).name());
        assertThrows(DatabaseExplorerRepository.NotFound.class,()->limited.rows("module_b","no_key",0,25));
    }
    @Test void pagesByPrimaryKeyAndPreservesNullEmptyAndJsonValues() throws Exception {
        var first=explorer.rows("module_a","people",0,1);
        assertEquals("id ASC",first.ordering());assertEquals(1L,first.nextOffset());
        assertEquals("1",first.rows().get(0).cells().get(0).value());assertTrue(first.rows().get(0).label().contains("Ada"));
        assertNull(first.rows().get(0).cells().get(2).value());assertEquals("",first.rows().get(0).cells().get(4).value());
        assertEquals("jsonb",first.columns().get(3).type());assertTrue(first.rows().get(0).cells().get(3).value().contains("\"n\": 1"));
        var second=explorer.rows("module_a","people",1,2);assertNull(second.nextOffset());assertEquals("2",second.rows().get(0).cells().get(0).value());assertEquals("10",second.rows().get(1).cells().get(0).value());
        try(var c=DriverManager.getConnection(url);var st=c.createStatement();var rs=st.executeQuery("SELECT count(*) FROM module_a.people")) {rs.next();assertEquals(3,rs.getInt(1));}
    }
    @Test void safelyQuotesUnusualIdentifiersAndBoundsLargeCells() {
        var page=explorer.rows("module_b","Odd\"Table",0,25);
        assertEquals("number ASC",page.ordering());var cell=page.rows().get(0).cells().get(1);
        assertTrue(cell.truncated());assertEquals(65536,cell.value().length());
        assertThrows(DatabaseExplorerRepository.NotFound.class,()->explorer.rows("module_a","people; DROP TABLE people;--",0,25));
        assertThrows(DatabaseExplorerRepository.NotFound.class,()->explorer.rows("pg_catalog","pg_class",0,25));
        assertEquals(3,explorer.rows("module_a","people",0,25).rows().size());
    }
    @Test void supportsEmptyTablesAndHonestDefaultOrdering() {
        assertTrue(explorer.rows("public","empty_table",0,25).rows().isEmpty());
        assertNull(explorer.rows("public","empty_table",0,25).nextOffset());
        assertEquals("Database default (order is not guaranteed)",explorer.rows("module_b","no_key",0,25).ordering());
        assertThrows(IllegalArgumentException.class,()->explorer.rows("public","empty_table",0,51));
    }
}

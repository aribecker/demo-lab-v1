package ariel.iteration2.weather.database;

import java.sql.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

@Repository
public class DatabaseExplorerRepository {
    public record Table(String name) {}
    public record Schema(String name, List<Table> tables) {}
    public record Catalog(String database, List<Schema> schemas) {}
    public record Column(String name, String type, boolean primaryKey) {}
    public record Cell(String value, boolean truncated) {}
    public record Row(long position, String label, List<Cell> cells) {}
    public record Page(String schema, String table, List<Column> columns, List<Row> rows,
                       String ordering, long offset, Long nextOffset) {}
    private record Target(long oid, String schema, String name) {}
    private final DatabaseConnections connections;
    static final int MAX_VALUE = 65536;
    private static final String TABLES = """
        SELECT c.oid,n.nspname,c.relname FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
        WHERE c.relkind IN ('r','p') AND left(n.nspname,3) <> 'pg_'
          AND n.nspname <> 'information_schema' AND n.nspname <> 'auth_private'
          AND has_schema_privilege(n.oid,'USAGE') AND has_table_privilege(c.oid,'SELECT')
        """;

    public DatabaseExplorerRepository(@Value("${simulation.database-url:}") String connection) {
        connections=new DatabaseConnections(connection);
    }
    public Catalog catalog() {
        return read(c -> {
            String database;
            try(var st=c.createStatement();var rs=st.executeQuery("SELECT current_database()")) {
                rs.next();database=rs.getString(1);
            }
            var schemas=new LinkedHashMap<String,List<Table>>();
            try(var st=c.createStatement();var rs=st.executeQuery(TABLES+" ORDER BY n.nspname,c.relname")) {
                while(rs.next()) schemas.computeIfAbsent(rs.getString(2),key->new ArrayList<>()).add(new Table(rs.getString(3)));
            }
            return new Catalog(database,schemas.entrySet().stream().map(e->new Schema(e.getKey(),List.copyOf(e.getValue()))).toList());
        });
    }
    public Page rows(String schema,String table,long offset,int limit) {
        if(schema==null || schema.isBlank() || table==null || table.isBlank() || offset<0 || offset>1000000 || limit<1 || limit>50)
            throw new IllegalArgumentException();
        return read(c -> {
            Target target;
            try(var st=c.prepareStatement(TABLES+" AND n.nspname=? AND c.relname=?")) {
                st.setString(1,schema);st.setString(2,table);
                try(var rs=st.executeQuery()) {
                    if(!rs.next())throw new NotFound();
                    target=new Target(rs.getLong(1),rs.getString(2),rs.getString(3));
                }
            }
            var keys=new ArrayList<String>();
            try(var st=c.prepareStatement("""
                SELECT a.attname FROM pg_catalog.pg_constraint k
                CROSS JOIN LATERAL unnest(k.conkey) WITH ORDINALITY AS pkcol(attnum,pos)
                JOIN pg_catalog.pg_attribute a ON a.attrelid=k.conrelid AND a.attnum=pkcol.attnum
                WHERE k.conrelid=?::oid AND k.contype='p' ORDER BY pkcol.pos
                """)) {
                st.setLong(1,target.oid());try(var rs=st.executeQuery()){while(rs.next())keys.add(rs.getString(1));}
            }
            var columns=new ArrayList<Column>();
            try(var st=c.prepareStatement("""
                SELECT attname,pg_catalog.format_type(atttypid,atttypmod)
                FROM pg_catalog.pg_attribute WHERE attrelid=?::oid AND attnum>0 AND NOT attisdropped ORDER BY attnum
                """)) {
                st.setLong(1,target.oid());try(var rs=st.executeQuery()){while(rs.next())columns.add(new Column(rs.getString(1),rs.getString(2),keys.contains(rs.getString(1))));}
            }
            var order=new ArrayList<>(keys);
            if(order.isEmpty())columns.stream().filter(col->col.name().equals("id")).findFirst().ifPresent(col->order.add(col.name()));
            String ordering=order.isEmpty()?"Database default (order is not guaranteed)":String.join(", ",order.stream().map(name->name+" ASC").toList());
            String projection=String.join(",",columns.stream().map(col->"left(source."+quote(col.name())+"::text,"+(MAX_VALUE+1)+") AS "+quote(col.name())).toList());
            String sql="SELECT "+projection+" FROM "+quote(target.schema())+"."+quote(target.name())+" AS source"
                +(order.isEmpty()?"":" ORDER BY "+String.join(",",order.stream().map(name->"source."+quote(name)+" ASC NULLS LAST").toList()))+" LIMIT ? OFFSET ?";
            var rows=new ArrayList<Row>();boolean more;
            try(var st=c.prepareStatement(sql)) {
                st.setInt(1,limit+1);st.setLong(2,offset);
                try(var rs=st.executeQuery()) {
                    while(rows.size()<limit && rs.next()) {
                        var cells=new ArrayList<Cell>();
                        for(int i=1;i<=columns.size();i++) {
                            String value=rs.getString(i);boolean truncated=value!=null && value.length()>MAX_VALUE;
                            cells.add(new Cell(truncated?value.substring(0,MAX_VALUE):value,truncated));
                        }
                        long position=offset+rows.size();
                        rows.add(new Row(position,label(columns,cells,order,position),List.copyOf(cells)));
                    }
                    more=rs.next();
                }
            }
            return new Page(target.schema(),target.name(),List.copyOf(columns),List.copyOf(rows),ordering,offset,more?offset+rows.size():null);
        });
    }
    private static String label(List<Column> columns,List<Cell> cells,List<String> keys,long position) {
        var names=new ArrayList<>(keys);
        for(String candidate:List.of("name","title","label","description","number")) {
            var match=columns.stream().filter(col->col.name().equalsIgnoreCase(candidate) && !names.contains(col.name())).findFirst();
            if(match.isPresent()){names.add(match.get().name());break;}
        }
        if(names.isEmpty() && !columns.isEmpty())names.add(columns.get(0).name());
        var parts=new ArrayList<String>();
        for(String name:names)for(int i=0;i<columns.size();i++)if(columns.get(i).name().equals(name)) {
            String value=cells.get(i).value();value=value==null?"NULL":value.isEmpty()?"(empty string)":value;
            parts.add(name+"="+(value.length()>80?value.substring(0,80)+"…":value));
        }
        String label=String.join(" · ",parts);return label.isEmpty()?"Row "+(position+1):label;
    }
    private static String quote(String identifier) { return "\""+identifier.replace("\"","\"\"")+"\""; }
    @FunctionalInterface private interface Query<T> { T execute(Connection c) throws SQLException; }
    private <T>T read(Query<T> query) {
        if(!connections.configured())throw new Unavailable();
        try(var c=connections.open()) {
            c.setReadOnly(true);c.setAutoCommit(false);
            try(var st=c.createStatement()) {
                st.execute("SET LOCAL statement_timeout = '5s'");st.execute("SET LOCAL lock_timeout = '2s'");
            }
            T result=query.execute(c);c.commit();return result;
        } catch(SQLException failure) { throw new Unavailable(); }
    }
    public static class Unavailable extends RuntimeException {}
    public static class NotFound extends RuntimeException {}
}

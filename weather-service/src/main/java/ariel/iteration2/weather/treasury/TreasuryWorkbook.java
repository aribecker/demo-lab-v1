package ariel.iteration2.weather.treasury;

import static ariel.iteration2.weather.treasury.TreasuryModels.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import java.util.zip.*;

/** Small streaming OOXML writer: values are literal strings, never spreadsheet formulas. */
final class TreasuryWorkbook {
 private TreasuryWorkbook(){}
 static final int CHUNK=30000;
 static String quote(String s){return "\""+s.replace("\"","\"\"")+"\"";}
 static List<String> tables(Connection c)throws SQLException{
  var result=new ArrayList<String>();
  try(var s=c.prepareStatement("SELECT table_name FROM information_schema.tables WHERE table_schema='treasury' AND table_type='BASE TABLE' ORDER BY table_name")){s.setQueryTimeout(20);try(var r=s.executeQuery()){while(r.next())result.add(r.getString(1));}}
  return result;
 }
 static void write(Connection c,Path file,List<String> tables)throws Exception{
  if(tables.isEmpty())throw new Problem(503,"No se encontraron las tablas de tesorería.");
  var names=new ArrayList<String>();var used=new HashSet<String>();
  for(String t:tables){String name=t.substring(0,Math.min(31,t.length())),base=name;int n=1;while(!used.add(name.toLowerCase(Locale.ROOT))){String suffix="_"+(n++);name=base.substring(0,Math.min(base.length(),31-suffix.length()))+suffix;}names.add(name);}
  try(var z=new ZipOutputStream(Files.newOutputStream(file))){
   StringBuilder types=new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>");
   StringBuilder book=new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets>"),rels=new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">");
   for(int i=0;i<tables.size();i++){int id=i+1;types.append("<Override PartName=\"/xl/worksheets/sheet"+id+".xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>");book.append("<sheet name=\""+xml(names.get(i))+"\" sheetId=\""+id+"\" r:id=\"rId"+id+"\"/>");rels.append("<Relationship Id=\"rId"+id+"\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet"+id+".xml\"/>");}
   entry(z,"[Content_Types].xml",types+"</Types>");entry(z,"_rels/.rels","<?xml version=\"1.0\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");entry(z,"xl/workbook.xml",book+"</sheets></workbook>");entry(z,"xl/_rels/workbook.xml.rels",rels+"</Relationships>");
   for(int i=0;i<tables.size();i++)sheet(c,z,tables.get(i),i+1);
  }
 }
 static void entry(ZipOutputStream z,String name,String value)throws IOException{z.putNextEntry(new ZipEntry(name));z.write(value.getBytes(StandardCharsets.UTF_8));z.closeEntry();}
 private static void sheet(Connection c,ZipOutputStream zip,String table,int number)throws Exception{
  String target="treasury."+quote(table);int[] parts;String[] labels;
  try(var s=c.createStatement();var r=s.executeQuery("SELECT * FROM "+target+" LIMIT 0")){
   var m=r.getMetaData();int count=m.getColumnCount();parts=new int[count];labels=new String[count];Arrays.fill(parts,1);
   for(int i=0;i<count;i++){labels[i]=m.getColumnName(i+1);boolean binary=Set.of(Types.BINARY,Types.VARBINARY,Types.LONGVARBINARY,Types.BLOB).contains(m.getColumnType(i+1));
    String expr=binary?"octet_length("+quote(labels[i])+")":"length(CAST("+quote(labels[i])+" AS text))";
    try(var len=c.createStatement()){len.setQueryTimeout(20);try(var sizes=len.executeQuery("SELECT COALESCE(MAX("+expr+"),0) FROM "+target)){sizes.next();long length=sizes.getLong(1);if(binary)length=4*((length+2)/3);parts[i]=(int)Math.max(1,(length+CHUNK-1)/CHUNK);}}
   }
  }
  if(Arrays.stream(parts).sum()>16384)throw new Problem(413,"Una tabla supera el máximo de columnas de Excel. No se envió un respaldo parcial.");
  zip.putNextEntry(new ZipEntry("xl/worksheets/sheet"+number+".xml"));var out=new OutputStreamWriter(zip,StandardCharsets.UTF_8);
  out.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetViews><sheetView workbookViewId=\"0\"><pane ySplit=\"1\" topLeftCell=\"A2\" activePane=\"bottomLeft\" state=\"frozen\"/></sheetView></sheetViews><sheetData><row r=\"1\">");
  for(int i=0;i<labels.length;i++)for(int part=0;part<parts[i];part++)cell(out,labels[i]+(parts[i]>1?" [parte "+(part+1)+"/"+parts[i]+"]":""));out.write("</row>");
  try(var s=c.createStatement()){s.setQueryTimeout(25);s.setFetchSize(100);try(var r=s.executeQuery("SELECT * FROM "+target)){
   int row=1;while(r.next()){if(++row>1048576)throw new Problem(413,"Una tabla supera el máximo de filas de Excel. No se envió un respaldo parcial.");out.write("<row r=\""+row+"\">");
    for(int i=0;i<labels.length;i++){Object obj=r.getObject(i+1);String value=obj==null?null:obj instanceof byte[] bytes?Base64.getEncoder().encodeToString(bytes):obj instanceof java.math.BigDecimal decimal?decimal.toPlainString():obj instanceof Timestamp time?time.toInstant().toString():obj.toString();
     for(int part=0;part<parts[i];part++){if(value==null)out.write("<c/>");else{int from=Math.min(part*CHUNK,value.length()),to=Math.min(from+CHUNK,value.length());if(to<value.length()&&to>from&&Character.isHighSurrogate(value.charAt(to-1)))throw new Problem(413,"Un texto necesita una partición especial para Excel. No se envió un respaldo parcial.");cell(out,value.substring(from,to));}}
    }out.write("</row>");
   }
  }}out.write("</sheetData></worksheet>");out.flush();zip.closeEntry();
 }
 private static void cell(Writer w,String s)throws IOException{w.write("<c t=\"inlineStr\"><is><t xml:space=\"preserve\">");w.write(xml(s));w.write("</t></is></c>");}
 // Excel's OOXML escapes preserve literal control characters and escape-like user text.
 static String xml(String s){StringBuilder b=new StringBuilder();for(int i=0;i<s.length();i++){char ch=s.charAt(i);if(ch=='_'&&i+7<=s.length()&&s.charAt(i+1)=='x'&&s.charAt(i+6)=='_'&&s.substring(i+2,i+6).matches("[0-9a-fA-F]{4}"))b.append("_x005F_");else if((ch<32&&ch!='\n'&&ch!='\t')||ch==0xfffe||ch==0xffff)b.append(String.format("_x%04X_",(int)ch));else switch(ch){case '&'->b.append("&amp;");case '<'->b.append("&lt;");case '>'->b.append("&gt;");case '"'->b.append("&quot;");default->b.append(ch);}}return b.toString();}
}

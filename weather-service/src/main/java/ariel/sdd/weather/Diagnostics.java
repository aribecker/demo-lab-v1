package ariel.sdd.weather;
import org.slf4j.Logger;
import java.util.UUID;
import java.util.concurrent.*;
public final class Diagnostics {
 private Diagnostics() {}
 public static String id(String value){return value!=null && value.matches("[A-Za-z0-9-]{1,80}")?value:UUID.randomUUID().toString();}
 public static long ms(long start){return TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start);}
 public static Throwable cause(Throwable error){while((error instanceof CompletionException || error instanceof ExecutionException)&&error.getCause()!=null)error=error.getCause();return error;}
 public static void failure(Logger log,String id,String stage,long start,Throwable error){Throwable cause=cause(error);log.warn("WEATHER_TRACE id={} stage={} event=failure elapsedMs={} exception={} message={}",id,stage,ms(start),cause.getClass().getName(),cause.getMessage(),cause);}
}

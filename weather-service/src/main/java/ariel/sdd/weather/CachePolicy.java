package ariel.sdd.weather;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
@Component
public class CachePolicy extends OncePerRequestFilter {
 private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(CachePolicy.class);
 @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws IOException,ServletException {
  String id=Diagnostics.id(request.getHeader("X-Request-Id"));request.setAttribute("weather.trace",id);
  response.setHeader("X-Request-Id",id);response.setHeader("Cache-Control","no-store");
  if(!request.getRequestURI().startsWith("/api/")){chain.doFilter(request,response);return;}
  long start=System.nanoTime();String path=request.getRequestURI();
  log.info("WEATHER_TRACE id={} stage=http event=start method={} path={}",id,request.getMethod(),path);
  try{chain.doFilter(request,response);}catch(IOException|ServletException|RuntimeException error){Diagnostics.failure(log,id,"http",start,error);throw error;}
  if(request.isAsyncStarted())request.getAsyncContext().addListener(new AsyncListener(){
   public void onComplete(AsyncEvent e){log.info("WEATHER_TRACE id={} stage=http event=complete path={} status={} elapsedMs={}",id,path,response.getStatus(),Diagnostics.ms(start));}
   public void onTimeout(AsyncEvent e){log.warn("WEATHER_TRACE id={} stage=http event=async-timeout path={} elapsedMs={}",id,path,Diagnostics.ms(start));}
   public void onError(AsyncEvent e){Diagnostics.failure(log,id,"http-async",start,e.getThrowable());}
   public void onStartAsync(AsyncEvent e){}
  });else log.info("WEATHER_TRACE id={} stage=http event=complete path={} status={} elapsedMs={}",id,path,response.getStatus(),Diagnostics.ms(start));
 }
}

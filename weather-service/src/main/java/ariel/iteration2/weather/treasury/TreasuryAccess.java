package ariel.iteration2.weather.treasury;

import ariel.iteration2.weather.auth.DemoSessions;
import ariel.iteration2.weather.auth.SimulatorAccess;
import jakarta.servlet.http.*;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class TreasuryAccess implements WebMvcConfigurer,HandlerInterceptor {
 private final DemoSessions sessions;
 public TreasuryAccess(DemoSessions sessions){this.sessions=sessions;}
 @Override public void addInterceptors(InterceptorRegistry registry){registry.addInterceptor(this).addPathPatterns("/api/treasury","/api/treasury/**");}
 @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler)throws Exception {
  response.setHeader("Cache-Control","no-store");response.setHeader("X-Content-Type-Options","nosniff");
  if("OPTIONS".equals(request.getMethod()))return true;
  String header=request.getHeader("Authorization");
  var session=sessions.find(header!=null&&header.startsWith("Bearer ")?header.substring(7):null);
  if(session!=null&&SimulatorAccess.allowed(session.profile())){request.setAttribute("treasury.actor",session.profile().email());return true;}
  response.setStatus(session==null?401:403);response.setContentType("application/json");
  response.getWriter().write(session==null?"{\"message\":\"Iniciá sesión con Google para acceder a la tesorería.\"}":"{\"message\":\"Tu cuenta no tiene acceso a esta tesorería.\"}");return false;
 }
}

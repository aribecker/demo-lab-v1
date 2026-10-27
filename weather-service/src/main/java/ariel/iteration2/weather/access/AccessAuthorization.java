package ariel.iteration2.weather.access;

import ariel.iteration2.weather.auth.DemoSessions;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;

@Component
public class AccessAuthorization {
 private final AccessDirectory directory;private final DemoSessions sessions;
 public AccessAuthorization(AccessDirectory directory,DemoSessions sessions){this.directory=directory;this.sessions=sessions;}
 public boolean require(AccessDirectory.Permission permission,HttpServletRequest request,HttpServletResponse response)throws Exception{
  if("OPTIONS".equals(request.getMethod()))return true;
  response.setHeader("Cache-Control","no-store");
  try{
   String h=request.getHeader("Authorization");var session=sessions.find(h!=null&&h.startsWith("Bearer ")?h.substring(7):null);
   if(directory.capabilities(session==null?null:session.profile()).allows(permission))return true;
   response.setStatus(session==null?401:403);response.setContentType("application/json");
   response.getWriter().write(session==null?"{\"code\":\"LOGIN_REQUIRED\",\"message\":\"Please sign in to use this feature.\"}":"{\"code\":\"ACCESS_FORBIDDEN\",\"message\":\"Lamentamos, usted no tiene acceso a esta sección.\"}");return false;
  }catch(AccessDirectory.Problem|ariel.iteration2.weather.auth.AuthSessionStore.Unavailable unavailable){
   response.setStatus(503);response.setContentType("application/json");response.getWriter().write("{\"code\":\"ACCESS_UNAVAILABLE\",\"message\":\"Access storage is unavailable. Please retry.\"}");return false;
  }
 }
}

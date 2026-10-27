package ariel.iteration2.weather.auth;

import ariel.iteration2.weather.access.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Every request uses current persisted groups, including the Everyone principal. */
@Component
public class SimulatorAccess implements HandlerInterceptor {
 private final AccessAuthorization authorization;
 public SimulatorAccess(AccessAuthorization authorization){this.authorization=authorization;}
 @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler)throws Exception{
  return authorization.require(AccessDirectory.Permission.SIMULATOR,request,response);
 }
}

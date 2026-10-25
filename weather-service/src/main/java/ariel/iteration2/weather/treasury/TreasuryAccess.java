package ariel.iteration2.weather.treasury;

import jakarta.servlet.http.*;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.*;

/** Treasury-only anonymous access, explicitly requested by the application owner. */
@Configuration
public class TreasuryAccess implements WebMvcConfigurer,HandlerInterceptor {
 @Override public void addInterceptors(InterceptorRegistry registry){registry.addInterceptor(this).addPathPatterns("/api/treasury","/api/treasury/**");}
 @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler) {
  response.setHeader("Cache-Control","no-store");response.setHeader("X-Content-Type-Options","nosniff");
  request.setAttribute("treasury.actor","anonymous");
  return true;
 }
}

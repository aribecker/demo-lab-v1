package ariel.iteration2.weather.access;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.*;
@Configuration
public class AccessConfiguration implements WebMvcConfigurer {
 private final AccessAuthorization access;
 public AccessConfiguration(AccessAuthorization access){this.access=access;}
 @Override public void addInterceptors(InterceptorRegistry registry){
  for(var permission:new AccessDirectory.Permission[]{AccessDirectory.Permission.USERS,AccessDirectory.Permission.GROUPS}){
   var base="/api/access/"+(permission==AccessDirectory.Permission.USERS?"users":"groups");
   registry.addInterceptor(new HandlerInterceptor(){public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler)throws Exception{return access.require(permission,request,response);}}).addPathPatterns(base,base+"/**");
  }
 }
}

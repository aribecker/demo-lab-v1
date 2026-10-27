package ariel.iteration2.weather.auth;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SimulatorAccessConfiguration implements WebMvcConfigurer {
    private final SimulatorAccess access;
    public SimulatorAccessConfiguration(SimulatorAccess access) { this.access=access; }
    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(access).addPathPatterns("/api/simulation","/api/simulation/**");
        registry.addInterceptor(new org.springframework.web.servlet.HandlerInterceptor() {
            @Override public boolean preHandle(jakarta.servlet.http.HttpServletRequest request,
                jakarta.servlet.http.HttpServletResponse response,Object handler) throws Exception {
                if("bitcoin_shared".equals(request.getParameter("schema"))
                    && "simulation_state".equals(request.getParameter("table")))
                    return access.preHandle(request,response,handler);
                return true;
            }
        }).addPathPatterns("/api/database/rows");
    }
}

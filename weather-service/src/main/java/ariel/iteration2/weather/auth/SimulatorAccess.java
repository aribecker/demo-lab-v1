package ariel.iteration2.weather.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Server-owned permission; caller-supplied identities are never accepted. */
@Component
public class SimulatorAccess implements HandlerInterceptor {
    private final DemoSessions sessions;
    public SimulatorAccess(DemoSessions sessions) { this.sessions=sessions; }
    public static boolean allowed(DemoSessions.Profile profile) {
        return profile!=null && "google".equals(profile.provider()) && profile.emailVerified()
            && profile.email()!=null && "aribecker2@gmail.com".equalsIgnoreCase(profile.email());
    }
    @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler) throws Exception {
        if("OPTIONS".equals(request.getMethod()))return true;
        String header=request.getHeader("Authorization");
        var session=sessions.find(header!=null && header.startsWith("Bearer ")?header.substring(7):null);
        if(session!=null && session.canUseSimulator())return true;
        response.setStatus(session==null?401:403);
        response.setHeader("Cache-Control","no-store");
        response.setContentType("application/json");
        response.getWriter().write(session==null
            ? "{\"code\":\"LOGIN_REQUIRED\",\"message\":\"Please sign in to use this feature.\"}"
            : "{\"code\":\"SIMULATOR_FORBIDDEN\",\"message\":\"You are not authorized to use this feature.\"}");
        return false;
    }
}

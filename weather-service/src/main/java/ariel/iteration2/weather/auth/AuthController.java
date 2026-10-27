package ariel.iteration2.weather.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthConfiguration.Registrations registrations;
    private final DemoSessions sessions;
    public AuthController(AuthConfiguration.Registrations registrations,DemoSessions sessions) {
        this.registrations=registrations;this.sessions=sessions;
    }
    @GetMapping("/providers") public List<AuthConfiguration.Provider> providers() { return registrations.providers(); }
    @GetMapping("/start/{provider}")
    public ResponseEntity<?> start(@PathVariable String provider,@RequestParam String challenge,@RequestParam(required=false) String app,HttpServletRequest request) {
        if(registrations.findByRegistrationId(provider)==null) return ResponseEntity.status(503).body(Map.of("error","provider_not_configured"));
        if(!challenge.matches("[A-Za-z0-9_-]{43}")) return ResponseEntity.badRequest().body(Map.of("error","invalid_request"));
        var old=request.getSession(false);if(old!=null)old.invalidate();
        request.getSession(true).setAttribute("demo.challenge",challenge);
        if("treasury".equals(app))request.getSession().setAttribute("demo.treasury",Boolean.TRUE);
        return ResponseEntity.status(302).header("Location","/oauth2/authorization/"+provider).build();
    }
    public record ExchangeRequest(String ticket,String verifier) {}
    @PostMapping("/exchange") public ResponseEntity<?> exchange(@RequestBody ExchangeRequest body) {
        try { return ResponseEntity.ok(sessions.exchange(body.ticket(),body.verifier())); }
        catch(IllegalArgumentException e) {return ResponseEntity.badRequest().body(Map.of("error","invalid_or_expired_login"));}
    }
    private String bearer(String header) {return header!=null&&header.startsWith("Bearer ")?header.substring(7):null;}
    @GetMapping("/me") public ResponseEntity<?> me(@RequestHeader(value="Authorization",required=false)String header) {
        var session=sessions.find(bearer(header));
        return session==null?ResponseEntity.status(401).body(Map.of("error","session_expired")):ResponseEntity.ok(session);
    }
    @PostMapping("/logout") public ResponseEntity<Void> logout(@RequestHeader(value="Authorization",required=false)String header) {
        sessions.revoke(bearer(header));return ResponseEntity.noContent().build();
    }
}

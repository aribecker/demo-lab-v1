package ariel.iteration2.weather.auth;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.security.oauth2.client.web.*;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class AuthConfiguration {
    public record Provider(String id, String name, boolean enabled) {}
    public static class Registrations implements ClientRegistrationRepository, Iterable<ClientRegistration> {
        final Map<String,ClientRegistration> entries = new LinkedHashMap<>();
        public ClientRegistration findByRegistrationId(String id) { return entries.get(id); }
        public Iterator<ClientRegistration> iterator() { return entries.values().iterator(); }
        public List<Provider> providers() {
            return List.of(new Provider("google","Google",entries.containsKey("google")),
                new Provider("github","GitHub",entries.containsKey("github")),
                new Provider("microsoft","Microsoft",entries.containsKey("microsoft")));
        }
    }
    @Bean
    Registrations registrations(Environment env, @Value("${auth.backend-url}") String backend) {
        Registrations repo = new Registrations();
        for (String id : List.of("google", "github", "microsoft")) {
            String client = env.getProperty("auth."+id+".client-id", "");
            String secret = env.getProperty("auth."+id+".client-secret", "");
            if (client.isBlank() || secret.isBlank()) continue;
            ClientRegistration.Builder b;
            if (id.equals("google")) b = CommonOAuth2Provider.GOOGLE.getBuilder(id);
            else if (id.equals("github")) b = CommonOAuth2Provider.GITHUB.getBuilder(id).scope("read:user", "user:email");
            else b = ClientRegistration.withRegistrationId(id)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationUri("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
                .tokenUri("https://login.microsoftonline.com/common/oauth2/v2.0/token")
                .userInfoUri("https://graph.microsoft.com/v1.0/me")
                .userNameAttributeName("id").clientName("Microsoft").scope("https://graph.microsoft.com/User.Read");
            repo.entries.put(id,b.clientId(client).clientSecret(secret)
                .redirectUri(backend+"/login/oauth2/code/"+id).build());
        }
        return repo;
    }
    @Bean
    SecurityFilterChain authSecurity(HttpSecurity http, Registrations repo, DemoSessions sessions,
            @Value("${auth.frontend-url}") String frontend) throws Exception {
        http.securityMatcher("/auth/**", "/oauth2/**", "/login/oauth2/**").cors(c -> {}).csrf(c -> c.ignoringRequestMatchers("/auth/exchange", "/auth/logout"))
            .authorizeHttpRequests(a -> a.anyRequest().permitAll())
            .requestCache(c -> c.disable()).formLogin(c -> c.disable()).httpBasic(c -> c.disable())
            .logout(c -> c.disable());
        if (!repo.entries.isEmpty()) {
            var resolver = new DefaultOAuth2AuthorizationRequestResolver(repo,"/oauth2/authorization");
            resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
            http.oauth2Login(o -> o.authorizedClientRepository(new DiscardingAuthorizedClients()).userInfoEndpoint(u -> u.userService(new GitHubUserService()))
                .authorizationEndpoint(a -> a.authorizationRequestResolver(resolver))
                .successHandler((request,response,authentication) -> {
                    var session = request.getSession(false);
                    String challenge = session == null ? null : (String)session.getAttribute("demo.challenge");
                    String callback = session != null && Boolean.TRUE.equals(session.getAttribute("demo.treasury"))
                        ? "https://ariel-treasury.onrender.com" : frontend;
                    var auth = (OAuth2AuthenticationToken)authentication;
                    String target = callback+"/login#auth_error=failed";
                    try {
                        var p = Profiles.from(auth.getAuthorizedClientRegistrationId(), auth.getPrincipal().getAttributes());
                        target = callback+"/login#ticket="+sessions.issue(p,challenge);
                    } catch (IllegalArgumentException ignored) { }
                    if (session != null) session.invalidate();
                    response.setHeader("Cache-Control","no-store");
                    response.setHeader("Referrer-Policy","no-referrer");
                    response.sendRedirect(target);
                }).failureHandler((request,response,error) -> {
                    var session=request.getSession(false);
                    String callback=session!=null && Boolean.TRUE.equals(session.getAttribute("demo.treasury"))?"https://ariel-treasury.onrender.com":frontend;
                    if(session!=null)session.invalidate();
                    response.sendRedirect(callback+"/login#auth_error=failed");
                }));
        }
        return http.build();
    }
}

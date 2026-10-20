package ariel.iteration2.weather.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.LinkedHashMap;
import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.user.*;

/** Only retrieves a missing email; never requests repositories or stores provider tokens. */
final class GitHubUserService extends DefaultOAuth2UserService {
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper json=new ObjectMapper();
    @Override public OAuth2User loadUser(OAuth2UserRequest request) {
        OAuth2User user=super.loadUser(request);
        if(!request.getClientRegistration().getRegistrationId().equals("github")||user.getAttribute("email")!=null)return user;
        var attributes=new LinkedHashMap<String,Object>(user.getAttributes());
        try {
            var query=HttpRequest.newBuilder(URI.create("https://api.github.com/user/emails"))
                .timeout(Duration.ofSeconds(5)).header("Accept","application/vnd.github+json")
                .header("Authorization","Bearer "+request.getAccessToken().getTokenValue()).GET().build();
            var response=http.send(query,HttpResponse.BodyHandlers.ofString());
            if(response.statusCode()==200)for(var email:json.readTree(response.body())){
                if(email.path("primary").asBoolean()&&email.path("verified").asBoolean()){
                    attributes.put("email",email.path("email").asText());break;
                }
            }
        } catch(InterruptedException e){Thread.currentThread().interrupt();}
        catch(Exception ignored){ /* Email can be unavailable; the authenticated identity is still valid. */ }
        return new DefaultOAuth2User(user.getAuthorities(),attributes,"id");
    }
}

package ariel.iteration2.weather.auth;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
/** Provider tokens are needed only during login/userinfo; do not retain them afterwards. */
final class DiscardingAuthorizedClients implements OAuth2AuthorizedClientRepository {
 public <T extends OAuth2AuthorizedClient> T loadAuthorizedClient(String id,Authentication principal,HttpServletRequest request){return null;}
 public void saveAuthorizedClient(OAuth2AuthorizedClient client,Authentication principal,HttpServletRequest request,HttpServletResponse response){}
 public void removeAuthorizedClient(String id,Authentication principal,HttpServletRequest request,HttpServletResponse response){}
}

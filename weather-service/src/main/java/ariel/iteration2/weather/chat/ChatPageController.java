package ariel.iteration2.weather.chat;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Direct-route refresh for the optional combined frontend/API test deployment. */
@Controller
class ChatPageController {
    @GetMapping({"/chatbot", "/weather", "/components", "/login"})
    String page() { return "forward:/index.html"; }
}

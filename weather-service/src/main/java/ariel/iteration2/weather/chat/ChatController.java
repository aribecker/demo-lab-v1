package ariel.iteration2.weather.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.Semaphore;
import org.springframework.ai.chat.messages.*;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.*;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.retry.support.RetryTemplate;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    record Model(String id, String name) {}
    public record Turn(String role, String content) {}
    public record Request(String model, List<Turn> messages) {}
    private final String key, base;
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
    private final Semaphore slot = new Semaphore(1);
    private volatile List<Model> cached = List.of(new Model("openrouter/free", "Automático · modelos gratuitos"));
    private volatile long refreshAt;

    public ChatController(@Value("${chat.api-key:}") String key,
                          @Value("${chat.base-url:https://openrouter.ai}") String base, ObjectMapper mapper) {
        this.key = key; this.base = base; this.mapper = mapper;
    }

    @GetMapping("/models")
    public Map<String, Object> models() {
        return Map.of("configured", !key.isBlank(), "models", catalog(), "freeOnly", true);
    }

    private synchronized List<Model> catalog() {
        if (System.currentTimeMillis() < refreshAt) return cached;
        refreshAt = System.currentTimeMillis() + 300_000;
        try {
            var response = http.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/models"))
                    .timeout(Duration.ofSeconds(6)).GET().build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return cached;
            var models = new ArrayList<Model>();
            models.add(new Model("openrouter/free", "Automático · modelos gratuitos"));
            for (JsonNode item : mapper.readTree(response.body()).path("data")) {
                String id = item.path("id").asText();
                var pricing = item.path("pricing");
                boolean text = item.path("architecture").path("output_modalities").toString().contains("\"text\"");
                if (id.endsWith(":free") && text && zero(pricing.path("prompt")) && zero(pricing.path("completion")))
                    models.add(new Model(id, item.path("name").asText(id) + " · gratis"));
            }
            cached = List.copyOf(models);
        } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        catch (Exception ignored) { /* Keep last good free catalog; no paid fallback. */ }
        return cached;
    }
    private boolean zero(JsonNode value) {
        try { return !value.isMissingNode() && new BigDecimal(value.asText()).compareTo(BigDecimal.ZERO) == 0; }
        catch (NumberFormatException e) { return false; }
    }

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Request request) {
        if (request == null || request.messages() == null || request.messages().isEmpty() || request.messages().size() > 20)
            return error(400, "La conversación debe contener entre 1 y 20 mensajes.");
        int total = 0;
        for (int i = 0; i < request.messages().size(); i++) {
            var turn = request.messages().get(i);
            if (turn == null || !Objects.equals(turn.role(), i % 2 == 0 ? "user" : "assistant") || turn.content() == null
                    || turn.content().isBlank() || turn.content().length() > 4000)
                return error(400, "Revisá los mensajes: máximo 4.000 caracteres por mensaje.");
            total += turn.content().length();
        }
        if (total > 24000 || request.messages().size() % 2 == 0)
            return error(400, "Iniciá una conversación nueva: se alcanzó el límite de contexto.");
        if (key.isBlank()) return error(503, "Falta configurar OPENROUTER_API_KEY en el servidor.");
        if (catalog().stream().noneMatch(m -> m.id().equals(request.model())))
            return error(400, "Elegí un modelo gratuito disponible en el selector.");
        if (!slot.tryAcquire()) return error(429, "El chatbot está ocupado. Probá de nuevo en unos segundos.");
        try {
            var factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(5000); factory.setReadTimeout(45000);
            var api = OpenAiApi.builder().baseUrl(base).apiKey(key).completionsPath("/api/v1/chat/completions")
                    .restClientBuilder(RestClient.builder().requestFactory(factory)).build();
            var model = OpenAiChatModel.builder().openAiApi(api)
                    .defaultOptions(OpenAiChatOptions.builder().model(request.model()).temperature(null).maxTokens(1024).build())
                    .retryTemplate(RetryTemplate.builder().maxAttempts(1).build()).build();
            List<Message> messages = new ArrayList<>();
            messages.add(new SystemMessage("Sos un asistente de propósito general. Respondé de forma clara, en el idioma del usuario."));
            for (var turn : request.messages()) messages.add(turn.role().equals("user")
                    ? new UserMessage(turn.content()) : new AssistantMessage(turn.content()));
            var result = model.call(new Prompt(messages));
            String answer = result.getResult().getOutput().getText();
            if (answer == null || answer.isBlank()) return error(502, "El modelo no devolvió texto. Probá otro modelo.");
            return ResponseEntity.ok(Map.of("reply", answer, "model", result.getMetadata().getModel() == null
                    ? request.model() : result.getMetadata().getModel()));
        } catch (Exception ignored) {
            return error(502, "El proveedor no pudo responder. Puede haber un límite gratuito o una demora; probá otro modelo.");
        } finally { slot.release(); }
    }
    private ResponseEntity<?> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}

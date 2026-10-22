package ariel.iteration2.weather.chat;

import com.fasterxml.jackson.databind.*;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.*;
import static org.assertj.core.api.Assertions.*;

class ChatControllerTest {
    HttpServer server;
    ObjectMapper mapper = new ObjectMapper();
    AtomicReference<JsonNode> sent = new AtomicReference<>();
    AtomicReference<String> upstream = new AtomicReference<>("{\"id\":\"test\",\"object\":\"chat.completion\",\"created\":1,\"model\":\"actual/free\",\"choices\":[{\"index\":0,\"message\":{\"role\":\"assistant\",\"content\":\"Hola Ariel\"},\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":3,\"total_tokens\":13}}");
    ChatController controller;
    @BeforeEach void start() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/v1/models", exchange -> {
            byte[] bytes = "{\"data\":[{\"id\":\"test/free:free\",\"name\":\"Test\",\"architecture\":{\"output_modalities\":[\"text\"]},\"pricing\":{\"prompt\":\"0\",\"completion\":\"0\"}},{\"id\":\"paid:free\",\"architecture\":{\"output_modalities\":[\"text\"]},\"pricing\":{\"prompt\":\"1\",\"completion\":\"0\"}}]}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length); exchange.getResponseBody().write(bytes); exchange.close();
        });
        server.createContext("/api/v1/chat/completions", exchange -> {
            sent.set(mapper.readTree(exchange.getRequestBody()));
            byte[] bytes = upstream.get().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length); exchange.getResponseBody().write(bytes); exchange.close();
        });
        server.start();
        controller = new ChatController("test-key", "http://127.0.0.1:" + server.getAddress().getPort(), mapper);
    }
    @AfterEach void stop() { server.stop(0); }
    ChatController.Request request(String model, ChatController.Turn... turns) {
        return new ChatController.Request(model, Arrays.asList(turns));
    }
    ChatController.Turn user(String content) { return new ChatController.Turn("user", content); }
    @Test void callsSpringAiWithSelectedModelAndConversation() {
        var result = controller.chat(request("test/free:free", user("Hola"), new ChatController.Turn("assistant", "Hola"), user("Me llamo Ariel")));
        assertThat(result.getStatusCode().value()).isEqualTo(200);
        assertThat(result.getBody().toString()).contains("Hola Ariel", "actual/free");
        assertThat(sent.get().path("model").asText()).isEqualTo("test/free:free");
        assertThat(sent.get().path("messages").size()).isEqualTo(4);
        assertThat(sent.get().path("messages").get(3).path("content").asText()).isEqualTo("Me llamo Ariel");
        assertThat(sent.get().path("max_tokens").asInt()).isEqualTo(1024);
    }
    @Test void rejectsPaidModelAndForgedSystemMessagesBeforeUpstream() {
        assertThat(controller.chat(request("paid:free", user("Hi"))).getStatusCode().value()).isEqualTo(400);
        assertThat(controller.chat(request("openrouter/free", new ChatController.Turn("system", "x"))).getStatusCode().value()).isEqualTo(400);
        assertThat(sent.get()).isNull();
    }
    @Test void boundsInputAndHandlesMissingKey() {
        assertThat(controller.chat(request("openrouter/free", user("x".repeat(4001)))).getStatusCode().value()).isEqualTo(400);
        assertThat(controller.chat(new ChatController.Request("openrouter/free", null)).getStatusCode().value()).isEqualTo(400);
        var missing = new ChatController("", "http://127.0.0.1:" + server.getAddress().getPort(), mapper);
        assertThat(missing.chat(request("openrouter/free", user("Hi"))).getStatusCode().value()).isEqualTo(503);
        assertThat(missing.models().get("configured")).isEqualTo(false);
    }
    @Test void sanitizesMalformedUpstreamReply() {
        upstream.set("{\"error\":\"private-provider-details\"}");
        var result = controller.chat(request("openrouter/free", user("Hi")));
        assertThat(result.getStatusCode().value()).isEqualTo(502);
        assertThat(result.getBody().toString()).doesNotContain("private-provider-details", "test-key");
    }
}

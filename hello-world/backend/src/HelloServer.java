import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

public final class HelloServer {
    private static final Map<String, String> ASSETS = Map.of(
        "/", "index.html", "/styles.css", "styles.css", "/app.js", "app.js");

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        String host = System.getenv().getOrDefault("HOST", "127.0.0.1");
        Path frontend = Path.of("frontend").toAbsolutePath();
        if (!Files.isRegularFile(frontend.resolve("index.html"))) {
            throw new IOException("Ejecutar desde la raíz del proyecto: falta frontend/index.html");
        }
        HttpServer server = HttpServer.create(new InetSocketAddress(host, port), 0);
        server.createContext("/", exchange -> handle(exchange, frontend));
        Runtime.getRuntime().addShutdownHook(new Thread(() -> server.stop(0)));
        server.start();
        System.out.println("Hello World iniciado en puerto " + server.getAddress().getPort());
    }

    private static void handle(HttpExchange exchange, Path frontend) throws IOException {
        try (exchange) {
            if (!exchange.getRequestMethod().equals("GET")) {
                exchange.getResponseHeaders().set("Allow", "GET");
                send(exchange, 405, "text/plain", "Método no permitido".getBytes(StandardCharsets.UTF_8));
                return;
            }
            String route = exchange.getRequestURI().getPath();
            if (route.equals("/api/hello")) {
                send(exchange, 200, "application/json", "{\"message\":\"Hello World!\"}".getBytes(StandardCharsets.UTF_8));
                return;
            }
            String asset = ASSETS.get(route);
            if (asset == null) {
                send(exchange, 404, "text/plain", "No encontrado".getBytes(StandardCharsets.UTF_8));
                return;
            }
            String type = asset.endsWith(".html") ? "text/html" : asset.endsWith(".css") ? "text/css" : "text/javascript";
            send(exchange, 200, type, Files.readAllBytes(frontend.resolve(asset)));
        }
    }

    private static void send(HttpExchange exchange, int status, String type, byte[] body) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", type + "; charset=utf-8");
        exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        exchange.sendResponseHeaders(status, body.length);
        exchange.getResponseBody().write(body);
    }
}

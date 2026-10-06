# Technical plan

Use Java 17 built-in HttpServer and HttpClient.sendAsync, CompletableFuture composition and a bounded deadline. Gson 2.11.0 validates/parses external JSON. Maven Shade packages runnable JAR. Preserve vanilla HTML/CSS/JS and API schema. Container: Maven/Temurin build stage, Temurin JRE runtime. Configure Java heap for 512 MB instance. Render Free service uses /health and backend-java branch. Original v002 tagged locally, original Site remains deployed.

Workspace is the primary source; Git branch preserves this experiment. Render requires Git provider repository access or a prebuilt image; the Sites Git remote cannot be assumed accessible to Render. Connection remains a separate prerequisite.

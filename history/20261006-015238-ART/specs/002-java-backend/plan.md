# Technical plan

Use Java 17 built-in HttpServer and HttpClient.sendAsync, CompletableFuture composition and a bounded deadline. Gson 2.11.0 validates/parses external JSON. Maven Shade packages runnable JAR. Preserve vanilla HTML/CSS/JS and API schema. Container: Maven/Temurin build stage, Temurin JRE runtime. Configure Java heap for 512 MB instance. Render Free service uses /health and backend-java branch. Original v002 tagged locally, original Site remains deployed.

Workspace is the primary source; Git branch preserves this experiment. Render requires Git provider repository access or a prebuilt image; the Sites Git remote cannot be assumed accessible to Render. Connection remains a separate prerequisite.

## Render transfer, 20261006-010419-ART
GitHub browser upload preserves the complete source tree in source-snapshot.tar.gz. Render-Dockerfile extracts that snapshot and builds java-backend with Maven. The normal Dockerfile remains available within the source tree for a future full Git push. Repository: aribecker/0080-prueba-SDD-full-stack, private, branch backend-java. Public service creation is pending explicit confirmation.

## Fuentes individuales — 20261006-014037-ART

Nueva rama java-fuentes con fuentes normales y Docker build directo de java-backend. Sustituye la transferencia comprimida. Render usará esta rama con Auto-Deploy para probar cambios manuales de GitHub.

## Versioned message — 20261006-014414-ART

Define APP_VERSION in Java, return version and Hello World message in successful API JSON. Display the returned message in the weather heading. Assert exact version and message in HTTP fixture tests, then commit to java-fuentes and verify Render Auto-Deploy.

## Version 004 — 20261006-014722-ART

Halve all three h1 clamp values. Update Java APP_VERSION, frontend badge, API fixture expectation and Maven artifact to 0.4.0; preserve prior SDD files. Commit and deploy on java-fuentes.

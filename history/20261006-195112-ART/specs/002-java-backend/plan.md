# Implementation plan — Spring Boot REST, 0.0.7

1. Archive the previous SDD documents with a timestamp.
2. Replace manual HttpServer routing with Spring Boot 3.5.16 / Spring MVC on Java 17.
3. Extract asynchronous provider logic into @Service WeatherService. Keep Java HttpClient.sendAsync, fallback and the 10-second deadline.
4. Define typed records for weather and API response. Expose GET /api/hello and /health through @RestController with constructor injection. Serialize through Spring's Jackson integration.
5. Map provider failures through @RestControllerAdvice and apply no-store via a servlet filter. Configure Render PORT, static assets and bounded Tomcat worker threads.
6. Keep the English interface and skeleton geometry, update version and Spring Boot labels.
7. Run @SpringBootTest integration tests with local provider fixtures, including provider timeout and static assets; package with the Spring Boot Maven plugin.
8. Commit source, SDD and deployment configuration to java-fuentes with a guarded branch update. Render Auto-Deploy rebuilds and tests the container.
9. Verify the service is Live, Spring Boot starts, and weather and stable loading work in the browser.

Official references:
- https://spring.io/guides/gs/rest-service/
- https://docs.spring.io/spring-boot/3.5/system-requirements.html

The primary workspace remains /workspace/sites/ssd-full-stack-java. Keep the previous releases in git/history; do not modify the original hosted Sites app.

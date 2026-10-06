# Weather application — Version 0.0.6 / Java 17

English UI, API messages, source code and active SDD specifications. Sources are individual files; historical snapshots retain their original content.

- Backend: `java-backend/src/main/java/WeatherServer.java`
- Frontend: `java-backend/src/main/resources/public/`
- Specifications: `specs/002-java-backend/`; earlier versions: `history/`
- Build: `cd java-backend && mvn package`
- Run: `java -jar target/weather-java-0.0.6.jar`
- Docker: `docker build -t sdd-weather-java .`
- Render: branch `java-fuentes`, `./Render-Dockerfile`, Free plan, health check `/health`, Auto-Deploy on commit.

## Manual GitHub change and deployment

1. Open `java-backend/src/main/resources/public/index.html` on `java-fuentes`.
2. Click the pencil and edit a visible English label, such as `Weather, full stack.`.
3. Save with **Commit changes** directly on `java-fuentes`.
4. Wait for Render to show **Live**, then reload https://ariel-sdd-weather-java.onrender.com/ .

For a backend change, edit `WeatherServer.java` and compile before committing. Each request fetches weather asynchronously; MET Norway is the fallback provider. Two/two/one/one fixed result lines and animated skeletons prevent layout jumps. Honor reduced-motion preferences. Do not copy iterative changes to OneDrive or deploy this Java branch to the original Sites app.

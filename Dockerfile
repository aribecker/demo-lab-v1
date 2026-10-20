FROM node:22-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm test && npm run build

FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY java-backend/ ./java-backend/
COPY --from=frontend /build/frontend/dist ./frontend/dist
RUN mvn -B -f java-backend/pom.xml -Dfrontend.prebuilt=true package
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/java-backend/target/weather-java-0.0.8.jar /app/app.jar
ENV PORT=8080
EXPOSE 8080
CMD ["java", "-XX:MaxRAMPercentage=65", "-jar", "/app/app.jar"]

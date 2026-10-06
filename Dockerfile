FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY java-backend/pom.xml ./pom.xml
COPY java-backend/src ./src
RUN mvn -B -DskipTests package
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/target/weather-java-0.4.0.jar /app/app.jar
ENV PORT=8080
EXPOSE 8080
CMD ["java", "-XX:MaxRAMPercentage=65", "-jar", "/app/app.jar"]

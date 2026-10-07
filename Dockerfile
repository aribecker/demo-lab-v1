FROM maven:3.9.9-eclipse-temurin-17 AS compile
WORKDIR /build
COPY java-backend/pom.xml ./pom.xml
COPY java-backend/src ./src
RUN mvn -B package
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=compile /build/target/weather-java-0.0.8.jar app.jar
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=65","-jar","app.jar"]

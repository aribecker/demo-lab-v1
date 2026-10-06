FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY backend/src/HelloServer.java backend/src/HelloServer.java
RUN mkdir -p build/classes && javac --release 21 --add-modules jdk.httpserver -d build/classes backend/src/HelloServer.java

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/classes build/classes
COPY frontend frontend
ENV HOST=0.0.0.0 PORT=8080
EXPOSE 8080
CMD ["java", "--add-modules", "jdk.httpserver", "-cp", "build/classes", "HelloServer"]

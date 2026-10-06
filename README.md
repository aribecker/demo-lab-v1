# Java test variant — SDD

Main project: /workspace/sites/ssd-full-stack-ariel (v002, existing Site).
Java variant: /workspace/sites/ssd-full-stack-java, branch backend-java.

Build: `cd java-backend && mvn package`.
Run: `java -jar target/weather-java-0.3.0.jar` (PORT defaults to 8080).
Docker: `docker build -t sdd-weather-java .` then `docker run --rm -p 8080:8080 sdd-weather-java`.
Render: select this branch from a connected Git repository, Docker runtime, Free instance and health path /health. render.yaml records settings. The Render URL is public unless application access control is added; obtain user approval before deploying with broader access than the existing private Site.

Do not deploy this Java branch to Sites. Do not synchronize OneDrive until requested. Source specifications are in specs/002-java-backend/.

Validation: Java compilation and deterministic HTTP integration tests passed. Live provider access from this workspace was unsuccessful; verify external connectivity on Render. Docker image build has not been run here because Docker is unavailable.

## Hello World — Java 21 + JavaScript

La aplicación Hello World con especificación SDD, instrucciones y pruebas está en [hello-world/README.md](hello-world/README.md). Ejecutar desde `hello-world/` con `bash scripts/run.sh`; validar con `bash scripts/test.sh`.

# SDD clean regeneration experiment

Branch: test-java-fuentes. Production source, interface and build/deploy configuration were deleted in a separate commit, retaining only specifications and frozen tests. The current Java application was regenerated from those inputs without restoring deleted production files. Version remains 0.0.8 for unchanged test contracts.

Build both modules: `mvn -B package -f java-backend/pom.xml` and `mvn -B package -f weather-service/pom.xml`. Run the preserved two-process smoke test: `python scripts/smoke-microservices.py`.

The independent Spring Boot applications use Render-Dockerfile and Weather-Dockerfile. Main API uses WEATHER_SERVICE_URL. Provider adapter uses Open-Meteo with MET Norway fallback. Java source is regenerated with Jackson rather than the previous provider parsing implementation.

Historical Node/Sites/worker test sources are preserved for archival context, not part of the current Java test suite. Frozen Java test suites and packaged-process test must pass unchanged before experimental deployment.

Specifications define behavior and basic layout but not complete pixel styling. The newly generated interface therefore does not claim visual pixel equivalence.

# Aplicación clima — versión 005 / Java 17

Fuentes individuales, sin archivo comprimido.

- Backend: `java-backend/src/main/java/WeatherServer.java`
- Frontend: `java-backend/src/main/resources/public/`
- SDD: `specs/002-java-backend/`; versiones previas en `history/`.
- Build local: `cd java-backend && mvn package`
- Ejecutar: `java -jar target/weather-java-0.5.0.jar`
- Render: rama `java-fuentes`, Dockerfile `./Render-Dockerfile`, plan Free, health `/health`.

## Prueba manual desde GitHub

1. En la rama `java-fuentes`, abrir `java-backend/src/main/resources/public/index.html`.
2. Pulsar el lápiz y cambiar un texto visible, por ejemplo `Clima, full stack.`.
3. Guardar con **Commit changes** directamente en `java-fuentes`.
4. Render con Auto-Deploy despliega el nuevo commit. Esperar estado Live y recargar https://ariel-sdd-weather-java.onrender.com/ .

Para probar un cambio en el backend, editar `WeatherServer.java` y compilar antes de confirmar. Cada consulta pide clima asincrónicamente; MET Norway es el proveedor alternativo.

# Hello World — Java + JavaScript

Una aplicación desarrollada con **SDD (Specification-Driven Development)**. Su especificación, plan y tareas están en [`specs/001-hello-world/`](specs/001-hello-world/).

## Ejecutar

Requisitos: JDK 21 o posterior y Bash. Para las pruebas, Node.js 22 o posterior. No necesita Maven, npm, base de datos ni credenciales.

```bash
cd /workspace/0080-prueba-SDD-full-stack/hello-world
bash scripts/setup.sh
bash scripts/run.sh
```

El servidor escucha en `127.0.0.1`, puerto `8080`. Abre esa dirección en un navegador cuando el entorno permita acceso local o reenvío de puertos. La pantalla incluye un botón que consulta `GET /api/hello` y muestra `Hello World!` junto a un timestamp UTC generado por el backend en cada petición.

Configura otro puerto o interfaz con `PORT=9090 HOST=0.0.0.0 bash scripts/run.sh`. Detén el servidor con Ctrl+C. El script de arranque compila antes de ejecutar.

Si no hay compilador en el entorno, `setup.sh` instala un JDK Temurin 21.0.8+9 local en `../toolchains/`, verificando el checksum SHA-256 fijado del artefacto oficial. Puedes usar un JDK 21 más reciente mediante `JAVA_HOME`. La descarga sólo es necesaria si falta el JDK local.

## Validar

```bash
bash scripts/test.sh
```

La suite inicia y detiene un backend en un puerto libre; comprueba API, página, archivos estáticos, 404 y 405. Prueba el controlador JavaScript con éxito, espera, solicitudes duplicadas y errores HTTP, de conexión y de formato, incluyendo reintentos. Usa las herramientas de pruebas nativas de Node.js; no descarga paquetes.

## Estructura y SDD

- `specs/001-hello-world/spec.md`: alcance y criterios AC1–AC6.
- `specs/001-hello-world/plan.md`: arquitectura y estrategia de validación.
- `specs/001-hello-world/tasks.md`: seguimiento de implementación y pruebas.
- `backend/src/HelloServer.java`: servidor HTTP del JDK y rutas explícitas.
- `frontend/`: HTML, CSS y módulo JavaScript.
- `tests/`: pruebas trazadas a los criterios de aceptación.
- `scripts/`: instalación, compilación, arranque y pruebas.

Para ampliar la aplicación, modifica primero la especificación y el plan, define los criterios nuevos y después implementa y valida su comportamiento.

## Resultado de validación

Compilación Java 21 y ocho pruebas automatizadas aprobadas en este entorno. La comprobación visual, la interacción completa en navegador y el lector de pantalla quedan como validaciones manuales; las pruebas del frontend verifican el controlador con objetos simulados.

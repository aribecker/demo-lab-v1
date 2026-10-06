# Plan técnico

1. Fijar el contrato y los criterios de aceptación en `spec.md`.
2. Implementar `HttpServer` del JDK con rutas explícitas para evitar acceso arbitrario a archivos. Usar UTF-8 y JSON con saludo y timestamp UTC generado con `Instant.now()`, sin caché.
3. Implementar un controlador JavaScript con dependencias inyectables para probar estados sin instalar frameworks. Servir sus archivos desde Java.
4. Compilar con `javac --release 21`; arrancar desde la raíz del proyecto con `scripts/run.sh`.
5. Ejecutar `scripts/test.sh`: compila, inicia una instancia aislada, comprueba contratos HTTP y ejecuta pruebas frontend con `node:test`.

No se necesita Maven ni npm. Los artefactos de compilación se guardan en `build/`, excluido de Git.

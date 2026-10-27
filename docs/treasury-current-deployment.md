# Publicación en los servicios actuales — 26/10/2026

El usuario autorizó explícitamente subir los cambios a las mismas ramas y
desplegar en los servicios actuales. Repositorio:
aribecker/0080-prueba-SDD-full-stack. Frontend: treasury-v1,
ariel-treasury. Backend: proximo-desarrollo-hello-world,
ariel-demo-integrated-api. No crear servicios ni bases adicionales.

## Alcance

Publicación del avance parcial: catálogo de proveedores, terceros obligatorios,
configuración de cuentas auxiliares, login y permisos por institución. No afirmar
que cargos, lotes, documentos de cobranza/pago, aplicaciones, recibos numerados,
correcciones documentales o conciliación histórica estén implementados.

## Validación previa

Suite completa Java: 103 casos, 93 aprobados, 10 omitidos porque necesitan
PostgreSQL loopback. Suite frontend: 33 aprobados. Build Vite aprobado.
Bootstrap de permisos probado con identidad Google verificada: coincide el
email configurado, se generan grants idempotentes para instituciones actuales
y nuevas, y se rechazan identidades distintas/no verificadas.

Logs del backend actual confirman esquema treasury en versión 2 y validación
Flyway correcta. No se obtuvo acceso SQL directo por su política de red.
V3 es aditiva: conserva asientos/importes existentes y V1/V2 sin cambios.
El build Docker existente ejecuta además las pruebas PostgreSQL en bases
locales desechables antes de publicar. Supervisar su resultado y la migración
V3 del runtime antes de declarar el backend activo.

## Acceso inicial y orden

Configurar TREASURY_BOOTSTRAP_OWNER_EMAIL con la misma cuenta propietaria Google
que el proyecto ya reconoce. Solo un login real, con email verificado, puede
aprovisionar sus permisos. No utilizar el permiso del simulador para autorizar
otras identidades. Primero publicar y verificar backend; después frontend,
conservando sus URLs y configuración de OAuth/CORS actuales.

En el momento de este commit la publicación y verificación siguen en curso;
las pruebas locales no sustituyen la comprobación del deploy específico y sus
logs. La verificación autenticada del usuario requiere que inicie sesión.

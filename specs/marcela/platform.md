# Plataforma Marcela Schpilberg — especificación SDD v1
Fecha: 2026-10-26. Fuente aprobada: plataforma_marcela_schpilberg_email_1234_corregida.html adjunto por el usuario.

## Alcance y arquitectura
Nueva zona de frontend en Render, separada de la demo integrada. Reutilizar React 19.3.1, Vite 6.4.4, Node 22 y Vitest 2.1.9 del repositorio aribecker/0080-prueba-SDD-full-stack. Directorio marcela-frontend/. No crear backend, base de datos ni servicio de pago: el formulario original hace POST nativo a https://formsubmit.co/conta.conmigo.1234@gmail.com. Si una ampliación necesita API propia, usar el backend compartido https://ariel-demo-integrated-api.onrender.com y especificar primero contrato y CORS. No cambiar servicios existentes.

## Diseño canónico
Esta marca tiene paleta propia; constituye una excepción explícita a la paleta azul de specs/design-system.md, conservando CSS centralizado y convención BEM.
- Verde principal #a8d85f y verde profundo #92c94e: gradiente 135 grados en encabezado, hero y pie.
- Texto principal #111111; secundario #2f3a2a; texto del hero #1f2a18; eyebrow #3c5c1a.
- Fondo #f8fbf1; sección tarifas #f4f8ef; tarjetas #ffffff; suave #eef7df.
- Naranja de acciones #f39a2d; precios #e66b00. Conservar fondo naranja original y usar texto oscuro #111111 en botones para mejorar contraste respecto del blanco del adjunto.
- Bordes #000000 de 2px; tarjeta destacada 3px. Focus 3px #111111 con offset 3px. Fondos blancos translúcidos en navegación, panel lateral y botón secundario.
- Familia Inter, system-ui, -apple-system, Segoe UI, sans-serif. El original no carga Inter: conservar fallback local sin dependencia de red.
- Texto base 16px y line-height 1.5. Marca 20px/800; subtítulo 11px/700 y tracking 2px. Eyebrow 12px/800 y tracking 2px.
- h1 clamp(34px,4.5vw,55px), line-height 1.1, tracking -1.5px; h2 30px, tracking -.8px; hero body 18px; precio 38px/900; presupuesto 28px; texto auxiliar 13px.
- Contenedor max 1180px, padding lateral 46px desktop y 30px móvil. Encabezado padding vertical 22px. Hero padding 67px 0 76px y gap 50px. Secciones padding 64px 0.
- Hero columnas 1.35fr .7fr; áreas y pasos tres columnas gap 19px; precios dos columnas gap 20px; formulario 1.5fr .8fr gap 22px y campos dos columnas gap 16px.
- Breakpoint 800px: una columna, hero gap 20px y padding 45px 0, secciones padding 45px, cabecera vertical. Soportar viewport 320px sin overflow horizontal.
- Radios: botones 10px, controles 9px, tarjetas 17px, panel hero 18px, píldora 100px. Sombra 0 8px 30px #132b3b09.
- Una entrada CSS src/styles.css, tokens centralizados, clases BEM ms-*. Sin estilos inline. Foco visible, controles con altura mínima 44px, movimiento reducido según prefers-reduced-motion.

## Contenido e interacción
Preservar nombre profesional, tres áreas (Auditoría y contabilidad, Pericias contables, Gestión de trámites), honorarios ARS 10.000/semana por una consulta, trabajos a convenir, plazo hasta 7 días corridos y condiciones del HTML. No incorporar pagos ni área administrativa.
R1: Inicio y Dejar consulta alternan vistas. Navegación por botones con aria-current y foco al título de formulario al abrirlo.
R2: Enviar una consulta abre formulario; Solicitar consulta preselecciona Abono semanal; Pedir presupuesto preselecciona Presupuesto de trabajo. Ver tarifas enlaza a #precios.
R3: Campos requeridos: nombre (max120), email válido (max200), área, servicio, asunto (max180), mensaje (min20,max5000), consentimiento explícito. Mantener valores al alternar vistas.
R4: POST real por navegador a FormSubmit con los nombres originales, asunto Nueva consulta contable desde la plataforma, template table, autorespuesta original y honeypot _honey. No fetch/AJAX, no almacenar consultas en navegador, no simular confirmación de recepción. Conservar CAPTCHA/activación del proveedor. Consentimiento se incluye en POST.
R5: Informar proveedor externo y activación pendiente sin prometer entrega. No enviar pruebas reales a terceros como parte de QA. La verificación de entrega queda pendiente de activación por el destinatario.
R6: FAQ con details/summary nativos, año actual dinámico, lenguaje español y título Marcela Schpilberg | Consultas contables.

## Despliegue y aceptación
R7: Rama independiente zona-marcela-schpilberg, mismo repositorio. Servicio estático previsto marcela-schpilberg-consultas; build cd marcela-frontend && npm ci && npm test && npm run build, publish marcela-frontend/dist, NODE_VERSION=22 y SKIP_INSTALL_DEPS=true. No modificar zona integrada. Seleccionar workspace únicamente tras confirmación del usuario.
Secuencia requerida: commit de especificación → commit de grounding → implementación/tests → despliegue → evidencia.
Validar R1/R2 con pruebas React; R3/R4 con contrato de formulario y validación nativa sin POST; R5 con texto visible; R6 con contenido/FAQ. Ejecutar npm ci, npm test y npm run build. Verificar escritorio y móvil si existe navegador disponible. Verificar estado terminal del deploy y URL HTTPS antes de anunciar publicación. Registrar límites de verificación.

# R42 — Specifications viewer grounding

Master specification checkpoint: 40d23d2eaec4c2ccc8b0f67365b0f3a3700b42ec. No implementation changes precede this checkpoint.

Observed eight Markdown files under specs/: requirements, architecture, acceptance, design-system, tasks, traceability, integrated-deployment-zone and original-java-promotion. They contain both current requirements and historical decisions; runtime secrets are not content sources. The current standalone viewer demonstrates highlighting, font controls and exact-source actions, but copies only six documents and is outside the application.

App.jsx owns menu/routes, Home.jsx feature cards, static-routes.mjs direct entries. main.jsx imports styles/index.css, which owns tokens and BEM block CSS. The existing Vite toolchain supports raw Markdown glob imports without another package. Existing frontend tests cover routing/feature isolation.

Generate a build-discovered lazy catalog for specs/**/*.md, a safe React source viewer and a central specifications CSS block. Do not embed the standalone HTML or duplicate its source JSON. Keep source exact for copy/download; tokenize presentation into escaped React spans. Use query selection from the inventory, async effect cleanup, local read error/retry and a filename filter. Tests cover real catalog completeness/content, stale imports, selected-file fallback, escaping and full-source actions. Add direct route, Home and menu, increment frontend2.12.0 and run full suite/style guard/build. Deploy frontend alone after validation, inspect the live route/documents and preserve all services/data/simulation controls.

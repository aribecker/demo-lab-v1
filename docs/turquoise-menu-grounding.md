# R49 — Turquoise palette and menu icons grounding

Specification: specs/design-system.md. The palette is owned by frontend/src/styles/tokens.css. App.jsx holds the 13 navigation destinations; shell-weather.css owns the disclosure/menu presentation. Central style validation already checks 7 contrast pairs, token references and BEM boundaries.

Implement the documented SVG drawings locally, map each destination to its specified ID, and keep labels/accessibility/authorization intact. Only frontend presentation changes. Run frontend regressions, existing contrast/style contract and production build. Deploy only the frontend to preserve the running API.

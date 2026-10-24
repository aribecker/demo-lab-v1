# Central CSS and BEM — v2.11.0

R41 is implemented after separate master-specification and code-grounding commits. The frontend has one CSS entry imported by main.jsx, a token palette and internal BEM block modules. Every feature composes shared controls/panels/fields/notices; SVG chart presentation is CSS-owned. Component CSS imports and legacy stylesheets were removed. The design system specification is specs/design-system.md; executable tokens live in frontend/src/styles/tokens.css. Future visual changes begin in that specification.

Validation: all110 existing frontend tests pass, the style-contract check validates central imports/BEM/token references/seven contrast pairs, and the production build succeeds. CSS preserves320px minimum width and existing breakpoints. Browser rendering is verified separately from source-level checks. No backend code, database migration, runtime credentials or deployment settings were changed.

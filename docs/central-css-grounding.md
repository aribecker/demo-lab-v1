# R41 — Central CSS / BEM code grounding

Specification checkpoint: 6c5d9e4ad2619a03f2fa07fa60b42b376d73ac57. Implementation has not started at this checkpoint.

## Observed source
main.jsx imports styles.css; People.jsx, Chatbot.jsx and Database.jsx each import their own CSS. styles.css mixes shell, navigation, Home, weather/gallery, auth, Bitcoin and simulation styles. Generic classes include intro, label, actions, status, error and user; navigation is styled by an ID. Weather phases and chat roles are concatenated as bare classes. BitcoinTracker.jsx hard-codes SVG axis, threshold and series colors. App.test.jsx queries two existing CSS class names. All feature JSX files reference these styles; no backend edits are needed.

## Generation plan
Create styles/index.css importing tokens, base, shared, shell, Home, weather, gallery, auth, Bitcoin, simulation, People, chat and Database blocks. Migrate every JSX class and dependent test selector to BEM. Compose shared panel/button/field/notice blocks explicitly, remove local CSS imports and legacy files, and move chart presentation into CSS. Preserve state values, handlers, request logic, DOM semantics and source attribution. Update only frontend version to2.11.0. Add a style-contract script to the standard test command, checking imports, BEM, presentation literals and core token contrast; run all existing regressions and production build.

## Verification boundaries
Read-only public UI verification only; do not click shared simulation commands or create database rows. Backend source/configuration and service plans remain unchanged. Check all routes, gallery states and expanded Database on desktop/mobile. A source guard cannot prove all visual rendering; verify the deployed UI separately.

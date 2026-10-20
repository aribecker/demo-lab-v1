# Plan — React frontend migration

1. Verify remote baseline and live branch; copy only files matching GitHub blob hashes into an isolated checkout.
2. Archive the previous active specifications, update Feature 002's frontend ownership and commit this feature before implementation.
3. Create frontend/ with pinned React/Vite tooling, the baseline CSS, React components and a cancellable single-request hook. Retain English UI and version 0.0.8.
4. Build a static initial loading shell from the same React component markup. Bundle the client to stable /app.js and /styles.css for existing Java test compatibility.
5. Add DOM tests for observable behavior and lifecycle races. Add parity checks against the frozen baseline HTML and CSS. Preserve the old tests unchanged.
6. Include the generated frontend in Maven resources. Normal Maven builds run npm ci, UI tests and Vite build; Docker builds use Node → Maven → JRE stages and the prebuilt profile.
7. Run frontend tests, Maven builds for both services and cross-process REST/static-asset smoke checks. Record immutable test hashes and traceability.
8. Commit implementation, then validation evidence. Publish only react-frontend-sdd through the GitHub connector; no changes to deployed branch pointers.

## Implementation choices
- React and Vite are used only for the frontend; the Java backend remains the public host.
- A small custom useWeather hook owns network lifecycle; component state replaces querySelector/textContent mutations.
- React's server renderer produces the initial loading shell during Vite build; client createRoot renders the page. Browser effects do not run during shell rendering.
- Existing fixed CSS slots provide loading geometry. Verification compares DOM structure and exact CSS, with screenshots described as unverified unless actually captured.
- Maven uses an explicitly versioned exec-maven-plugin profile activated unless frontend.prebuilt is set. The prebuilt flag is reserved for output already produced by the Node stage.

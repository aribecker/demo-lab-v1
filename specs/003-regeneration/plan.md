# Regeneration plan

1. Create isolated worktree and branch from the completed 0.0.8 source tree.
2. Record SHA-256 of preserved test sources, then commit removal of production Java, UI, build files, archived production source and deployment configuration.
3. Read only retained SDD and test contracts to reconstruct the current Java application. Historical specifications resolve inherited layout details; active microservice specification takes precedence over earlier runtime/version requirements.
4. Recreate Java classes, Maven descriptors, HTML/CSS/JS and Dockerfiles. Do not restore deleted files. Current Java Maven and HTTP gates supersede historical Node/Sites npm gates for this experiment.
5. Package both modules while running frozen integration suites, execute preserved two-process smoke test, compare test hashes and check JavaScript syntax.
6. Only after passing acceptance, commit regenerated application and deploy two independent Render Free services from test-java-fuentes.
7. Verify real weather through both experimental services and compare slot geometry while loading. Record exact URLs, commits, test evidence and limits. Preserve existing deployments.

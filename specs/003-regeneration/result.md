# Regeneration experiment result

Verified: 2026-10-07 UTC. Branch: test-java-fuentes. Contract version remains 0.0.8.

## Auditable checkpoints

- 578fa91dc7c4c53b8e75273751c706e4668c2dfd: delete production application, interface and build/deployment configuration; retain specifications and existing test sources only.
- 2e2eca6c4eeac0ea141d9c61d40dbbdf93cef597: freshly regenerate two Java 17 Spring Boot REST services, UI and build/deployment configuration from retained requirements and frozen test contracts.
- Nine retained test/support files match their original SHA-256 values in test-hashes.json.

## Verification

Both Maven package builds succeeded. Each existing Java integration suite passed with zero failures, errors or skipped tests. The unchanged Python packaged-process smoke test passed, exercising two fresh requests through both services. JavaScript syntax and git whitespace checks passed.

Historical Node/worker test sources are preserved unchanged as archival artifacts; they are not executable acceptance suites for the current Java architecture and were not run. Passing current tests demonstrates their covered behavior, not complete specification coverage or pixel-identical reconstruction.

Both isolated Render Free deployments reached live on implementation commit 2e2eca6:

| Service | Render ID | Deploy ID |
| --- | --- | --- |
| Weather | srv-db35ddom7kps73d3jolg | dep-db35de8m7kps73d3jqo0 |
| Application | srv-db35dhhsrm7s73e601vg | dep-db35di1srm7s73e602lg |

Application: https://ariel-sdd-test-java-app.onrender.com/

Weather: https://ariel-sdd-test-java-weather.onrender.com/api/weather

Live weather and main greeting requests succeeded. MET Norway fallback returned numeric temperature, humidity and wind; forecast labeling, version, timestamp and multi-service architecture were present. Browser initial load and button refresh succeeded. Card height was 425.59375 CSS px before, during and after loading at the verification viewport; the loading state disabled the button and preserved allocated slots.

The original services and their deployment branches were not modified. Visual presentation was rebuilt from textual specifications; earlier generated UI sources were not retained.

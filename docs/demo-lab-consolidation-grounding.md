# R50 grounding

Current demo-lab/main 588ee94 and source feature f146729 share ancestor db22fbcc. Use an ordinary history-preserving merge, not a tree replacement. Destination-only AccessManagement, access package/migrations, marketClient reconnection, records.css, theme and menu changes must survive. Gómez changes are isolated in SharedState, SimulationEngine/Service/Controller, a new GomezTrading class/component, associated controls/tests and specification files. Existing row-lock persistence prevents duplicate poll slots when the legacy integrated backend shares the same state; preserve that behavior.

Keep canonical service configuration already pointing to demo-lab/main. Import all legacy heads under legacy-0080/* to retain work on other historical branches without making them the production source. Root AGENTS.md records the user's repository decision. Existing deployment URLs and credentials remain outside Git source secrets.

Render's Node 22 frontend build exposed an existing Routing.test.jsx global timer-count assertion: after leaving the gallery it observed an unrelated timer. ComponentGallery already clears its timeout in its unmount effect. Capture the specific 900 ms timeout handle and verify clearTimeout receives that handle on navigation; keep gallery refresh and no-live-loader assertions. No application behavior changes.

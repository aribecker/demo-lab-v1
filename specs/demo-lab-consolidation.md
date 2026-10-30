# R50 — consolidate Demo Lab and Gómez on canonical main

User authorization: migrate the complete 0080 source/history into aribecker/demo-lab, put current functionality on main, reconfigure and deploy, and persist the canonical project location. This specification supersedes R48's earlier hold-before-merge instruction and R49's access blocker, resolved using a user-supplied credential without committing that credential.

## Source of truth

Canonical repository: aribecker/demo-lab, main. Existing destination baseline: 588ee9430f886d896736d9a031441b80139d6067. Integrated 0080 baseline: 31441d3ddaf3733e2c2b128986c4db3fbf2b857e. Gómez source: 26d20a05733b0ef5c5915754fbf3dda7b07d9d4b; subsequent migration specification: f1467296497de77e0145306c72c97a2346ce1194. Preserve source history and branches as legacy-0080/* without overriding destination work.

## Required result

- Merge the integrated application and Gómez strategy into the existing Demo Lab, retaining all destination-only Users/Groups CRUD, configurable route authorization, Everyone review grant, turquoise theme, menu icons, responsive record layout and market reconnection handling.
- Preserve existing PostgreSQL tables and migrations. Gómez adds JSON fields to bitcoin_shared.simulation_state.document as specified in gomez-trading.md, with no schema or data reset. Preserve auth_private sessions and demo_lab access configuration.
- Keep the existing canonical frontend/API service IDs and URLs; both deploy this repository/main. Check frontend origins and API CORS using the existing deployment configuration; do not invent or expose secrets.
- Legacy 0080 remains retained, not deleted or archived. Keep unrelated Treasury/ContaConmigo services unchanged. No paid resource or billing change.
- Retain historical service entry points while moving future development to canonical main. Legacy runtime dependencies must be explicitly recorded before later retirement; do not make unrelated weather/people backends run the trading simulator.
- Persist project guidance in root AGENTS.md and the deployment spec/README. Canonical location is demo-lab/main; 0080 is a historical experiment pending later cleanup.

## Verification

Run the destination's complete frontend tests/style contract/build and Java package with disposable PostgreSQL. Verify that source features and destination access/navigation regressions pass together. Publish a normal merge to main without force, deploy both canonical services, verify deployed SHAs, health, market data, CORS, protected controls and served Gómez assets/specification. Use read-only production checks, no trading Reset. Record deploy IDs and any remaining hosting/login prerequisites honestly.

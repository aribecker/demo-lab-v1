# R50 — canonical Demo Lab consolidation

Date: 2026-10-29, Buenos Aires. Canonical repository: https://github.com/aribecker/demo-lab, branch main. 0080 is retained as a historical experiment for later retirement, not deleted.

## Provenance and preservation

- Destination main before migration: 588ee9430f886d896736d9a031441b80139d6067.
- Source integrated head: 31441d3ddaf3733e2c2b128986c4db3fbf2b857e; reviewed Gómez implementation: 26d20a05733b0ef5c5915754fbf3dda7b07d9d4b.
- R50 specification/grounding commit: 35c8f02dab125c117541dfaa5885c9aacd794523.
- History-preserving merge to canonical main: 8c9bc1ee37151b23339c23e8ddb609606e832047.
- Frontend CI test-isolation correction: a0531a6e97e1882725bb2d41d1993bb110119b08. Application/backend code is unchanged by this correction.
- All 18 legacy source heads were copied as legacy-0080/* branches. Source v2.0.1 tag is preserved as legacy-0080/v2.0.1. No target ref was force-overwritten.
- No source tracked file is missing from the merged destination. Existing target-only Users/Groups, configurable access, review grant, navigation, theme, layout and market reconnection code were preserved.
- No PostgreSQL table or migration was replaced; Gómez uses additive fields in the existing simulation JSON. No production Reset, real trade, replacement database or billing change was performed.

## Validation

- Java 17 package with disposable PostgreSQL 17.11: 123 tests, zero failures/errors/skips, executable JAR built.
- Frontend: 163 tests across 24 files, central style contract and production build passed.
- Render backend Docker build independently repeated all 123 Java tests successfully.
- Initial frontend Render build exposed an existing gallery test that counted unrelated framework timers globally. The correction checks cancellation of the actual preview timer instead; local full suite with deployment API origin configuration passed.

## Deployment records

- Canonical API: srv-dbge9g0u01pc73fl3f7g, deploy dep-dbhvig6k1f9s73ec5dr0, commit 8c9bc1ee37151b23339c23e8ddb609606e832047, confirmed Live.
- Frontend retry: srv-dbge9jt9el5s738tcjr0, deploy dep-dbhvllgu01pc73aiel3g, commit a0531a6e97e1882725bb2d41d1993bb110119b08; confirmed Live, including 163 passing Render frontend tests.
- Legacy integrated API: configured SIMULATION_SCHEDULING_ENABLED=false after canonical API was confirmed Live and read successfully. Deploy dep-dbhvk459el5s738kejkg confirmed Live and applies this runtime-only change. No global simulation pause or stored balance change was issued.

## Verified canonical API behavior

/health and /api/people/health returned 200/UP, including actual PostgreSQL availability. CORS returned https://demo-lab-jeov.onrender.com. /api/bitcoin returned stored market readings and rate audit counts. /api/simulation returned the existing holding_btc/classic run with one trade, new Gómez defaults (120-second setting), and an enabled healthy scheduler; the run was not switched or reset. /api/access/me retained Everyone's owner-authorized review capabilities. /api/database excluded demo_lab and auth_private.

Google/GitHub/Microsoft providers are disabled on the canonical backend because their credentials are not enabled there. This was a pre-existing dedicated-deployment prerequisite, not a source migration regression. No credential was copied from another service or committed. OAuth sign-in therefore remains separately pending; the existing Everyone review grant remains in effect.

## Persistent project location

Root AGENTS.md, README and specs/demo-lab-consolidation.md establish demo-lab/main as the canonical source. The old 0080 location must not be used for new Demo Lab development. Legacy services and the weather provider are retained for compatibility until their remaining dependencies can be retired explicitly. Treasury and ContaConmigo canonical repositories/services are unchanged.


## Final frontend verification

The canonical homepage, /trading-simulator/, /users/, /groups/ and /specifications/ returned HTTP 200. Served module /assets/index-ADj5TuF8.js contains the Gómez strategy and Relaunch controls, Users/Groups routes and the canonical https://demo-lab-api.onrender.com origin; the old integrated API origin is absent. Both canonical services remain configured for aribecker/demo-lab/main. No browser screenshot or Google-login success is claimed.

Legacy 0080/main now has AGENTS.md directing new Demo Lab work to this repository (commit 4c3f2e38fb03b874448c18575785839b0edfa00d). No old repository/service was deleted. Legacy weather and other historical clients remain for a later explicit cleanup; canonical application code and all future changes use demo-lab/main.

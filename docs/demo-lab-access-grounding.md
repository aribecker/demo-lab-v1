# R48 code grounding

SimulatorAccess.java and DemoSessions record constructors currently hardcode the verified Google owner. AuthSessionStore persists only identity/session expiry; preserve that model and calculate permissions on session resolution. SimulatorAccessConfiguration also protects raw bitcoin_shared.simulation_state reads.

DatabaseConnections provides direct JDBC. Existing Flyway namespaces are public/People, auth_private/sessions, treasury/accounting, bitcoin_shared/history. New demo_lab migrations must use a separate history table. DatabaseExplorerRepository excludes private namespaces and must also exclude demo_lab.

AuthContext, SimulatorGate and App own route/menu gating. Extend them with independently computed capabilities and use the existing bearer/PKCE clients; never grant a named user on a frontend email comparison. Existing tests use isolated H2 and disposable PostgreSQL; update former owner-only assumptions and add both public-grant and revoked-grant scenarios.

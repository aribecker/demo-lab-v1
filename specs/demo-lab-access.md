# R48 — Configurable Demo Lab access

This specification supersedes the fixed owner-only authorization in R46 for Demo Lab. The existing database is shared with Treasury, but its treasury schema and bitcoin_shared market/simulator state are separate. Add authorization tables exclusively in demo_lab; preserve all existing schemas, users, sessions, balances and records.

## Model and initial migration
- Users: numeric ID, first name, last name, normalized unique email; special reserved Everyone principal has no email and cannot authenticate or be deleted/converted into a regular user. Seed Ariel Becker / aribecker2@gmail.com. Owner seed identity is immutable to avoid accidental loss; names remain editable.
- Groups: numeric ID, unique editable name and one or more section permissions: SIMULATOR, USERS, GROUPS. Membership is many-to-many.
- Seed Trading Simulator, Users administration, Groups administration groups; owner belongs to all three. Everyone belongs only to Trading Simulator initially.
- Bootstrap occurs once, transactionally. Later edits/removals survive restarts, and redeploys must never silently restore grants.

## Authorization
- Everyone grants apply to all visitors, including anonymous and signed-in people. Thus the initial simulator is accessible without login. Other named-user grants require a verified Google email matching a registered user exactly after trimming/lowercasing; no client-supplied identity, dot removal or plus-alias normalization.
- Compute current permissions from persisted memberships for each API request. Revoke access immediately when membership or identity changes; a token does not cache grants.
- Independently gate /trading-simulator, /users, /groups and all their backend reads/writes. Default deny; 401 anonymous, 403 authenticated, 503 unavailable authorization storage. Never treat storage failure as Everyone access.
- Users CRUD requires USERS. Groups CRUD and membership replacement require GROUPS. Groups managers may read a minimal user selection directory for assigning memberships. Users-only managers cannot assign groups.
- Everyone may be assigned to other groups through the authorized group editor, explicitly making those permissions public. Keep at least one named group administrator in every transaction; serialize changes to prevent concurrent lockout.
- Hide demo_lab from the public database explorer, including direct row requests. Protect raw simulation state using the same SIMULATOR decision.

## UI and API
- Always-visible menu entries Trading Simulator, Users, Groups lead to permission gates. Greeting uses authenticated profile name; denied signed-in users see the existing Spanish denial and anonymous denied users see Login.
- Public GET /api/access/me returns current canUseSimulator/canManageUsers/canManageGroups booleans only. Bearer identity is optional for Everyone grants. Existing auth session capability is recalculated from groups.
- CRUD /api/access/users and /api/access/groups uses POST/PUT/DELETE. GET group member options/members and PUT memberships are group-admin restricted. Validate IDs, names, normalized email, duplicate input and allowed permissions; report safe errors without SQL/credentials.
- Forms provide list, create, edit, delete and group membership editing; reject stale/denied actions and retain errors visibly. Refresh capability checks on navigation, focus and periodically, including anonymous sessions. No public sign-up or password database. Existing Google OAuth is reused.

## Validation and rollout
Test anonymous Everyone access, verified owner and other identities, three independent permissions, CRUD validation and duplicates, membership changes on an existing token, initial seed persistence across restart, last-admin protection, authorization storage outage and private-schema exclusion. Test frontend anonymous/denied/authorized gates and CRUD flows. Apply additive Flyway migration via normal startup, deploy backend before frontend, verify public reads and anonymous administration denial without changing existing simulation state. OAuth remains separately configured.

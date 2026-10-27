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

## Temporary administration review — 2026-10-27
The owner explicitly requests Everyone membership in the Users administration and Groups administration groups as well, to examine the application without waiting for Google OAuth. This intentionally permits anonymous administration reads and writes through the same group checks. Keep the named owner in every group.

Apply an opt-in, transactionally recorded V2 data migration in the existing demo_lab access history. ACCESS_REVIEW_EVERYONE_ADMINISTRATION=true on demo-lab-api enables the assignment on first application of V2; default false elsewhere. Do not use a per-request authorization bypass or a recurring environment override. V2 must not restore memberships after an administrator removes Everyone, even when the opt-in remains set at restart. The setting does not revoke grants when turned off; membership CRUD remains the authority. Existing fresh-install defaults outside this explicitly enabled deployment remain simulator-only. No Treasury, simulator-state or identity records change.

Verify the one-time grant and removal persistence with isolated storage; in production confirm all three anonymous capabilities and the owner/Everyone memberships by read-only API calls.

## Users / Groups navigation isolation — 2026-10-27
Navigating Users → Groups or Groups → Users through the menu or browser history must render the destination without a blank screen, regardless of whether the previous list, edit form or membership editor was open. Each administration route owns a separate mounted CRUD state: rows, draft, selected ID, loading/error/notice, saving state and membership selection. Enter the destination with its own empty create form and list load; never render user records/drafts as group records or the reverse. Leaving aborts active requests; late results from the old route must not populate the new screen. Keep existing section permission gates, keyboard navigation and persisted data unchanged.

Regression: reproduce the failure with Users loaded, navigate to Groups, inspect its permissions form, open a membership editor, return to Users and repeat. Also navigate away while a list request is pending, then resolve that stale request and confirm only destination data remain. The correction is frontend-only; no database or permission changes are required.

# Everyone administration review assignment

Owner request on 2026-10-27: Everyone also belongs to Users administration and Groups administration for application review. Specification: specs/demo-lab-access.md, temporary administration review addendum.

The existing database cannot be written by the read-only Render query connector, and Google login is not configured yet. Use an explicitly enabled, one-time transactional V2 Java data migration through the existing internal database connection. No authorization bypass or identity impersonation is introduced. ACCESS_REVIEW_EVERYONE_ADMINISTRATION=true is merged into demo-lab-api configuration, mirrored by deploy/integrated-zone.json.

The migration changes only the two named default administration groups and only adds missing Everyone memberships. Owner memberships remain intact. Fresh environments default to disabled. Flyway records V2 in demo_lab.access_schema_history, including when disabled; later environment changes do not replay the migration. Remove Everyone through group membership CRUD to close access; restart does not restore it. Turning off the environment flag alone does not revoke already persisted memberships.

Validation: isolated V1-to-V2 upgrade, default-deny regression suite, public capabilities when opted in, preserved owner grants and removal persistence with the opt-in still enabled. PostgreSQL build test also exercises the opted-in migration against a disposable loopback database. Production verification reads all three capability flags and memberships, without issuing trades or editing user records.

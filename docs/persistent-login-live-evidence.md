# R47 live evidence — 2026-10-25

Backend deploy dep-dbf4d50473hc73bqdg7g is live on 9a0bb5341a1bc175dd9d7415f898ab541b0a941d. Frontend deploy dep-dbf4f1g473hc73bqkb20 is live on f706b139e1536557601e38ecdb0a59706a039ac5 (v2.14.0). Render passed 75 Java and 141 frontend tests, with no failures or skipped tests; frontend production build passed.

Production API logs confirmed successful auth_private V1 migration. Live checks: a forged bearer on /auth/me returns401; database catalog returns200 and omits auth_private; explicit auth_private/application_sessions row access returns404; anonymous simulator access returns401; Google provider remains enabled. External metadata inspection was blocked by the database network allowlist; no allowlist change was made. No profile/session rows were read or production trading commands issued. Live browser confirmed v2.14.0 login and the seven-day persistence notice.

Automated H2/PostgreSQL tests verify restoration after a new store/service instance, exact seven-day expiry, cross-instance logout and hash-only storage. Frontend tests verify a fresh client lifecycle with empty sessionStorage restores from localStorage, 401 and logout cleanup, timeout/failure token retention and cross-tab logout. Final real-account Chrome close/reopen verification requires the owner to sign in once after rollout; no test owner session was created in production.

Activation requires only opening /login, refreshing and signing in once with Google. Reopen using the same normal Chrome profile. No Google Cloud/Render environment/manual SQL action is needed. Incognito and clearing site data do not retain the session.

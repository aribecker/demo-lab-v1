# Demo Lab — project continuity

The canonical repository is **aribecker/demo-lab**, default and production branch **main**.
All Demo Lab, Bitcoin Tracker, trading simulator, Users and Groups work starts here.

**aribecker/0080-prueba-SDD-full-stack is a legacy experiment.** It is retained temporarily for history and possible later retirement. Do not start new Demo Lab features there. Historical source branches are preserved under legacy-0080/ in this repository.

Use SDD: update the authoritative specifications in specs/ first, ground the change in current code, implement, run relevant tests/builds, and record release evidence. Preserve current permissions, authentication, database schemas, rate history and pending simulation cycles. Never reset a deployed simulation or replace its database as part of a release.

Render production services: demo-lab (frontend srv-dbge9jt9el5s738tcjr0, https://demo-lab-jeov.onrender.com) and demo-lab-api (Java srv-dbge9g0u01pc73fl3f7g, https://demo-lab-api.onrender.com). Both use this repository and main. Treat integrated-zone documents referring to 0080 as historical unless explicitly marked current. Treasury and ContaConmigo have separate canonical repositories.

Do not commit tokens, OAuth secrets, database credentials, generated builds or local test databases.

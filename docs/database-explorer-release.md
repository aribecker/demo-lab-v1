# Database explorer — usage and validation

The Database menu option provides a read-only explorer at /database. It groups tables by their actual schema names. Expand a table with + to load rows, then expand a row with + to inspect every column, its PostgreSQL type and text/null value.

Rows sort by primary key or id in ascending order when available. Tables without either use database default order, which is not guaranteed. Pages load25 rows, with Load more and refresh controls. Long individual values show an explicit truncation marker. NULL and empty string remain distinct, and values are rendered as text rather than HTML.

The backend reuses the application's existing database connection. Catalog metadata validates accessible base tables, identifiers are quoted and query parameters are bound. Reads run in read-only transactions with query timeouts. The explorer does not offer arbitrary SQL or write operations and excludes system schemas and views.

Validation covers grouped schemas, lazy disclosure, row/column expansion, paging, error/retry, safe value rendering, direct routing, HTTP validation and rejected writes. Disposable PostgreSQL fixtures cover permissions, unusual identifiers, numeric key ordering, NULL/empty/JSON values, truncation and non-mutation. The automated suites passed110 frontend tests and37 backend tests.

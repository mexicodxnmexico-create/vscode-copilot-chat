## 2025-02-27 - [Optimizing node:sqlite Prepared Statements]
**Learning:** Reusing prepared statements in `node:sqlite` (via `database.prepare()`) significantly reduces overhead, yielding ~30% performance improvement in batch operations like `PersistentTfIdf.addOrUpdate`.
**Action:** Always cache prepared statements as class properties for frequently executed queries.

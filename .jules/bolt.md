## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2025-02-18 - SQLite Prepared Statements in Hot Paths
**Learning:** `db.prepare()` is expensive (parsing SQL, planning query). In `PersistentTfIdf`, statements were prepared inside loops and batch processing functions, leading to significant overhead during indexing and searching.
**Action:** Always cache `StatementSync` objects in the class constructor or lazily for frequently executed queries, especially those in loops (like `INSERT` per chunk or `SELECT` per search term).

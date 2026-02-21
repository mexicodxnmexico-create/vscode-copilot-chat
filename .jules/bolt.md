## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-05-23 - SQLite Prepared Statements in Hot Loops
**Learning:** Recompiling SQLite statements (`db.prepare(...)`) inside hot loops (like `delete` or batch processing) is a major performance bottleneck.
**Action:** Always reuse prepared statements by hoisting them out of loops or caching them as class properties for frequently called methods. Batch updates where possible to minimize transaction overhead.

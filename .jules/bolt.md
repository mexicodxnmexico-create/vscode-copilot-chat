## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-05-18 - Await Map Optimization with Promise.all
**Learning:** Sequential async awaits inside loops like `for (const x of y) { await someFunc(x) }` create significant bottlenecks.
**Action:** When order does not strictly matter or can be restored after, map arrays/sets to a `Promise.all` structure to execute asynchronous operations (e.g., mapping model endpoints) in parallel, while still handling individual errors cleanly inside the map functions.

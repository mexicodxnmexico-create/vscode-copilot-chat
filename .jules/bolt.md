## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-05 - Optimize Git file stats fetching
**Learning:** In `chatSessionWorktreeServiceImpl.ts`, file statistics for worktree index and working tree changes were being fetched sequentially using a `for...of` loop with `await gitService.diffIndexWithHEADShortStats(change.uri)`. This caused an N+1 query problem, leading to high latency when processing multiple files.
**Action:** When fetching statistics or processing independent asynchronous operations on arrays (especially for I/O bounds like Git commands), map the array to promises using `.map(async ...)` and execute them concurrently with `Promise.all()`. Handle individual item failures by wrapping the internal promise in a `try/catch` block, returning `undefined`, and filtering out the undefined results afterwards.

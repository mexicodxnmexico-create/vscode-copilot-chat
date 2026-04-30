## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-08 - Fast String Truncation
**Learning:** Checking string byte length with `new TextEncoder().encode(text).length` is extremely slow because it allocates massive memory buffers. Node.js's `Buffer.byteLength(text, 'utf8')` is >3.5x faster. Also, truncating a large string to a byte limit is faster by first slicing the string `text.slice(0, maxIndexableFileSize)` (as 1 char >= 1 byte in utf8) before doing the exact byte-wise truncation with `Buffer.from(slicedString, 'utf8')`.
**Action:** Use `Buffer.byteLength(text, 'utf8')` and string slicing before buffer conversion to avoid memory allocation bottlenecks on large strings.
## 2026-04-30 - Batch workspace file indexing

**Learning:** Unbounded `Promise.all` on large arrays like file lists can lead to thousands of concurrent I/O operations (e.g. `stat` checks in `shouldIndexWorkspaceFile`), which causes scalability and memory regressions.
**Action:** When refactoring to concurrent execution or handling large data sets, explicitly group promises into limited batches (e.g., batch size of 200) before passing them to `Promise.all`.

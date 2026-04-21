## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-08 - Fast String Truncation
**Learning:** Checking string byte length with `new TextEncoder().encode(text).length` is extremely slow because it allocates massive memory buffers. Node.js's `Buffer.byteLength(text, 'utf8')` is >3.5x faster. Also, truncating a large string to a byte limit is faster by first slicing the string `text.slice(0, maxIndexableFileSize)` (as 1 char >= 1 byte in utf8) before doing the exact byte-wise truncation with `Buffer.from(slicedString, 'utf8')`.
**Action:** Use `Buffer.byteLength(text, 'utf8')` and string slicing before buffer conversion to avoid memory allocation bottlenecks on large strings.
## 2026-04-21 - Optimize sequential IO loops
**Learning:** Sequential `for...of` loops containing `await` for network IO (like fetching GitHub custom agents) cause significant performance bottlenecks due to serial roundtrips. However, naively applying `Promise.all()` to unbounded arrays can exhaust resources or trigger rate limits.
**Action:** Use a batched concurrent approach, slicing the array into smaller chunks (e.g., 5) and using `await Promise.all()` on each chunk to balance speed and safety. Always ensure unit tests relying on deterministic execution order are updated (e.g., by sorting the results).

## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-08 - Fast String Truncation
**Learning:** Checking string byte length with `new TextEncoder().encode(text).length` is extremely slow because it allocates massive memory buffers. Node.js's `Buffer.byteLength(text, 'utf8')` is >3.5x faster. Also, truncating a large string to a byte limit is faster by first slicing the string `text.slice(0, maxIndexableFileSize)` (as 1 char >= 1 byte in utf8) before doing the exact byte-wise truncation with `Buffer.from(slicedString, 'utf8')`.
**Action:** Use `Buffer.byteLength(text, 'utf8')` and string slicing before buffer conversion to avoid memory allocation bottlenecks on large strings.
## 2024-04-01 - Parallelize SDK model mapping
**Learning:** Sequential API calls or lookups (like mapping multiple model IDs) inside a loop can be a significant performance bottleneck due to cumulative wait times, especially when the operations are independent.
**Action:** When refactoring sequential loops into concurrent `Promise.all` operations, ensure that you explicitly convert iterable objects like `Set` into arrays using `Array.from(set).map(...)`, as `Set` natively lacks a `.map()` method. This can vastly improve execution time on latency-bound operations.

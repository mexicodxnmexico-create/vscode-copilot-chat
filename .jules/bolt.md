## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-08 - Fast String Truncation
**Learning:** Checking string byte length with `new TextEncoder().encode(text).length` is extremely slow because it allocates massive memory buffers. Node.js's `Buffer.byteLength(text, 'utf8')` is >3.5x faster. Also, truncating a large string to a byte limit is faster by first slicing the string `text.slice(0, maxIndexableFileSize)` (as 1 char >= 1 byte in utf8) before doing the exact byte-wise truncation with `Buffer.from(slicedString, 'utf8')`.
**Action:** Use `Buffer.byteLength(text, 'utf8')` and string slicing before buffer conversion to avoid memory allocation bottlenecks on large strings.

## 2026-05-05 - Concurrent async execution over iteration mappings
**Learning:** Naively executing sequential asynchronous requests (like `getCustomAgentDetails` or `fileSystem.delete`) within a standard array `.forEach` or simple `for...of` loops blocks iteration loops, dramatically decreasing execution speed by waiting for I/O round trips at each index before moving to the next.
**Action:** When converting lists of promises, use `.map` alongside `Promise.all()` to fire concurrent operations when the promises have independent outcomes and are safe to run in parallel. When doing so, be careful of unbounded concurrency or altering sequential logic (like an iterative `hasChanges` flag check). Use batching or concurrency limiters when fetching from external APIs to prevent rate-limiting or large memory spikes.

## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-08 - Fast String Truncation
**Learning:** Checking string byte length with `new TextEncoder().encode(text).length` is extremely slow because it allocates massive memory buffers. Node.js's `Buffer.byteLength(text, 'utf8')` is >3.5x faster. Also, truncating a large string to a byte limit is faster by first slicing the string `text.slice(0, maxIndexableFileSize)` (as 1 char >= 1 byte in utf8) before doing the exact byte-wise truncation with `Buffer.from(slicedString, 'utf8')`.
**Action:** Use `Buffer.byteLength(text, 'utf8')` and string slicing before buffer conversion to avoid memory allocation bottlenecks on large strings.

## 2026-04-11 - Array Flattening Optimization
**Learning:** Using `.reduce((acc, cur) => acc.concat(cur), [])` is a common anti-pattern for array flattening that results in O(N^2) time complexity because it allocates intermediate arrays on every iteration. Native `.flat()` and `.flatMap()` are O(N) and significantly more efficient, especially in performance-critical paths like streaming payloads.
**Action:** Always prefer `Array.prototype.flat()` or `Array.prototype.flatMap()` over the reduce/concat pattern for array flattening.

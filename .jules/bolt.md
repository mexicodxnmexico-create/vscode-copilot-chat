## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-08 - Fast String Truncation
**Learning:** Checking string byte length with `new TextEncoder().encode(text).length` is extremely slow because it allocates massive memory buffers. Node.js's `Buffer.byteLength(text, 'utf8')` is >3.5x faster. Also, truncating a large string to a byte limit is faster by first slicing the string `text.slice(0, maxIndexableFileSize)` (as 1 char >= 1 byte in utf8) before doing the exact byte-wise truncation with `Buffer.from(slicedString, 'utf8')`.
**Action:** Use `Buffer.byteLength(text, 'utf8')` and string slicing before buffer conversion to avoid memory allocation bottlenecks on large strings.
## 2024-03-22 - O(N^2) Array Flattening Anti-Pattern
**Learning:** The codebase contains multiple instances of `.reduce((acc, cur) => acc.concat(cur), [])` to flatten arrays. This is an $O(N^2)$ operation because `concat` creates a new array at each step, copying all previously accumulated elements. For an array of 10,000 elements, this takes ~2000ms compared to ~2ms using native `Array.flat()`.
**Action:** Always prefer native `Array.flat()` for array flattening. When looking for performance wins, `grep` for `.reduce` and `.concat` to identify these anti-patterns.

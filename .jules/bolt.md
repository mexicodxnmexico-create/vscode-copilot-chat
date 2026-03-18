## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-08 - Fast String Truncation
**Learning:** Checking string byte length with `new TextEncoder().encode(text).length` is extremely slow because it allocates massive memory buffers. Node.js's `Buffer.byteLength(text, 'utf8')` is >3.5x faster. Also, truncating a large string to a byte limit is faster by first slicing the string `text.slice(0, maxIndexableFileSize)` (as 1 char >= 1 byte in utf8) before doing the exact byte-wise truncation with `Buffer.from(slicedString, 'utf8')`.
**Action:** Use `Buffer.byteLength(text, 'utf8')` and string slicing before buffer conversion to avoid memory allocation bottlenecks on large strings.

## 2024-03-22 - Fast Array Flattening
**Learning:** Using `array.reduce((acc, cur) => acc.concat(cur), [])` for array flattening is extremely slow for large datasets because it introduces an $O(N^2)$ time complexity and excessive memory allocations by copying arrays repeatedly. Node.js native `array.flat()` and `array.flatMap()` operates in $O(N)$ and is significantly faster, scaling far better with high data density.
**Action:** Always prefer native `.flat()` and `.flatMap()` operations over manual array accumulation inside `.reduce()`. Also, remember to avoid performing optimizations on files explicitly labeled as "DO NOT modify" (such as cloned VSCode commons).

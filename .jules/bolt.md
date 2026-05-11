## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-08 - Fast String Truncation
**Learning:** Checking string byte length with `new TextEncoder().encode(text).length` is extremely slow because it allocates massive memory buffers. Node.js's `Buffer.byteLength(text, 'utf8')` is >3.5x faster. Also, truncating a large string to a byte limit is faster by first slicing the string `text.slice(0, maxIndexableFileSize)` (as 1 char >= 1 byte in utf8) before doing the exact byte-wise truncation with `Buffer.from(slicedString, 'utf8')`.
**Action:** Use `Buffer.byteLength(text, 'utf8')` and string slicing before buffer conversion to avoid memory allocation bottlenecks on large strings.
## 2026-05-11 - Fast Byte Length Calculation
**Learning:** Using `new TextEncoder().encode(string).byteLength` to measure a string's size allocates a full `Uint8Array` in memory simply to measure its length, which causes significant memory pressure and is slow for large strings. In Node.js environments, `Buffer.byteLength(string, 'utf8')` achieves the same result significantly faster without the memory allocation overhead.
**Action:** When measuring the byte size of a string in Node environments, always prefer `Buffer.byteLength()` to avoid unnecessary intermediate array allocations.

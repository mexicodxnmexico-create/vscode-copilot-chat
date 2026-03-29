## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-08 - Fast String Truncation
**Learning:** Checking string byte length with `new TextEncoder().encode(text).length` is extremely slow because it allocates massive memory buffers. Node.js's `Buffer.byteLength(text, 'utf8')` is >3.5x faster. Also, truncating a large string to a byte limit is faster by first slicing the string `text.slice(0, maxIndexableFileSize)` (as 1 char >= 1 byte in utf8) before doing the exact byte-wise truncation with `Buffer.from(slicedString, 'utf8')`.
**Action:** Use `Buffer.byteLength(text, 'utf8')` and string slicing before buffer conversion to avoid memory allocation bottlenecks on large strings.

## 2024-10-23 - Parallelize file loading in applyPatch parser
**Learning:** Sequential await loops on independent asynchronous tasks (like opening multiple files to apply a patch) create unnecessary latency proportional to the number of tasks. Refactoring to map an array into promises and awaiting them concurrently with `Promise.all` can massively reduce total execution time, especially when file I/O operations are involved.
**Action:** Identify independent async operations in loops and replace them with `Promise.all()`. Handle exceptions explicitly inside the map callback to maintain expected error throwing behavior (e.g. throwing a wrapped error) so `Promise.all` correctly rejects upon failure.

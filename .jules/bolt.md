## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-05-18 - Avoid array allocations in reduce
**Learning:** Using `[...iterator].reduce(...)` forces unnecessary array allocations. In performance-sensitive code (e.g. iterating maps for cost calculations), creating an array from an iterator prior to a reduction operation adds significant GC overhead and runtime latency.
**Action:** Replace `[...iterator].reduce(...)` with a standard `for...of` loop over the iterator to compute the reduction in-place, avoiding array allocations entirely.

## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).
## 2024-03-05 - Optimize string length checks
**Learning:** Checking UTF-8 string lengths using `Buffer.byteLength(text, 'utf8')` is much faster and more accurate than `TextEncoder().encode(text).length`. The JS native `text.length * X` fast path checks can be completely replaced by the Buffer API for simplicity and speed.
**Action:** Use `Buffer.byteLength(text, 'utf8')` over `TextEncoder` when checking byte sizes in Node.js extensions.

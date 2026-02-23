## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-03-08 - String Splitting Overhead
**Learning:** `splitLines` (splitting by `\r\n|\r|\n`) allocates an array of strings for the entire content. When used only to check the first few or last lines of a large string (e.g. metadata stripping), this is extremely wasteful (O(N) allocation).
**Action:** Use manual index scanning (`indexOf`, `lastIndexOf`) or stateful `RegExp.exec` to check for prefixes/suffixes without allocating substrings for the entire content. This yielded ~4300x speedup for non-matching large strings.

## 2025-02-23 - [Regex Performance in Tokenization]
**Learning:** Complex regexes with lookarounds (`(?<=...)`, `(?!...)`) in hot loops like tokenizers can be significantly slower than simpler regexes combined with manual checks. Also, `match` inside loops allocates arrays, which can be avoided with `test` pre-checks.
**Action:** When optimizing tokenizers or parsers, prefer simple greedy matching (`/[\w]+/g`) and use manual JS logic for boundary checks and filtering. Add guards before expensive string operations like `split` or `match`.

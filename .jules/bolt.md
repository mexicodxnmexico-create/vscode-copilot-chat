## 2024-05-22 - Regex Optimization in TF-IDF
**Learning:** The TF-IDF implementation uses `splitTerms` heavily during indexing and search. The original implementation used a complex regex with lookarounds in `matchAll`, which was a bottleneck. Replacing it with a simple tokenization loop and manual checks yielded a ~50% performance improvement.
**Action:** Inspect other text processing utilities for complex regexes that can be simplified into tokenization + manual filtering, especially in hot paths like search or parsing.

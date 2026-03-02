## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).

## 2024-06-25 - Redundant AST parsing in reference resolution
**Learning:** In `selectionContextHelpers.ts`, `treeSitterAST.getFunctionDefinitions()` and `treeSitterAST.getClassDeclarations()` were being called repeatedly inside a loop per call expression, causing redundant parsing overhead on the same document URI.
**Action:** Caching these AST parsing results per document URI using a `Map` within the execution context avoids the duplicate work when resolving multiple references located in the same file.

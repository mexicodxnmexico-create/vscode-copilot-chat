## 2024-03-08 - Regex Optimization in TF-IDF
**Learning:** Using `matchAll` with complex regexes containing lookarounds can be significantly slower than a manual scanning loop with simple regexes and `exec`.
**Action:** When parsing large amounts of text (like in TF-IDF tokenization), prefer scanning loops with simple regexes. Also, be careful with global regexes (`/g`) in module scope as they are stateful (`lastIndex`).
## 2026-02-28 - AST Parsing Optimization in Selection Context
**Learning:** Multiple consecutive calls to `treeSitterAST.getFunctionDefinitions()` and `getClassDeclarations()` for the same document within loops cause redundant, expensive AST parsing operations. This is specifically relevant in context resolvers like `selectionContextHelpers.ts` where multiple symbols from the same file are processed.
**Action:** Always cache the results of AST queries (e.g., using a `Map<string, Promise<T>>` keyed by document URI) per function execution or request scope when iterating over symbols that may originate from the same document.

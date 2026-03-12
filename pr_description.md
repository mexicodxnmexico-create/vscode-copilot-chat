🎯 **What:** Added missing tests for the `extractIdentifier` and `isDocumentableNode` functions in `src/platform/parser/node/util.ts`.
📊 **Coverage:** Covered successful identifier extraction across all supported languages (Python, C#, Go, JavaScript, TypeScript, C++, Java, Ruby) and default fallbacks. Also covered `isDocumentableNode` for various language types. Verified undefined handling when identifiers are absent.
✨ **Result:** Enhanced test coverage ensures correct identifier extraction logic is maintained and prevents regressions when modifying the parser utilities.

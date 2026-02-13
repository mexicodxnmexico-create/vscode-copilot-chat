## 2025-02-23 - Lazy Logging for Inline Edits
**Learning:** Expensive string computations for debug logging were happening eagerly on the hot path of inline completions. Deferring these using lambdas and optimizing the patch generation logic significantly reduces overhead.
**Action:** Check for eager logging of expensive objects in performance-critical paths. Implement lazy evaluation where appropriate.

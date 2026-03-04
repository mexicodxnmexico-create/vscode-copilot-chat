## 2023-10-27 - [Avoid redundant aria-labels or titles on textual buttons]
**Learning:** Adding a title or aria-label that exactly matches the visible text of a button is redundant and can cause screen readers to announce the text twice.
**Action:** Reserve title attributes for icon-only buttons or use them to provide *additional* contextual information (e.g., "Click to insert this suggestion into your code" instead of "Accept suggestion 1").

## 2025-03-04 - [Provide empty states and grammatically correct pluralization]
**Learning:** Returning blank screens on zero suggestions (even after 100% completion) leaves users unsure if an error occurred. Inaccurate plurals ("1 Suggestions", "0 Suggestions") degrade perceived quality.
**Action:** Add helpful fallback "empty state" messages and conditionally render plurals using `count === 1 ? 'Suggestion' : 'Suggestions'` or early exits. Clean up stale aria- attributes like `aria-describedby` when async state completes.

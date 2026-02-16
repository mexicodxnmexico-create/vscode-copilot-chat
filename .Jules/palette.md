## 2026-02-16 - Suggestions Panel Accessibility
**Learning:** `aria-busy` was permanently `true` on the suggestions container, confusing screen readers. Also, `pre` tags for code snippets were not keyboard focusable, preventing scrolling for keyboard users.
**Action:** Ensure dynamic containers toggle `aria-busy` when loading completes. Explicitly add `tabindex="0"` to scrollable code blocks in webviews if they are not naturally focusable.

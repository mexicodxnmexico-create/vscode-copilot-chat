## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-05-06 - Empty states for dynamic UI panels
**Learning:** When dynamic UI panels (like webviews) display no results after loading is complete, an empty state with `role="status"` and a clear call-to-action should be provided to avoid user confusion.
**Action:** Always verify that loading completion handlers gracefully render a helpful empty state when the result set is empty.

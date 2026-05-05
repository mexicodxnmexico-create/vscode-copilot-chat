## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-05-05 - Empty states for dynamic UI panels
**Learning:** When dynamic UI panels (like `suggestionsPanelWebview.ts`) display no results after loading is complete, a clear empty state using `role="status"` is needed to avoid user confusion and communicate that the process finished but yielded no items.
**Action:** Always provide an empty state (e.g., using `role="status"`) with an explanation and call-to-action when dynamic UI panels return empty results.

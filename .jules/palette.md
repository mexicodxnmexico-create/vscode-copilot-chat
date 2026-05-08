## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.
## 2026-05-08 - Empty state for dynamic webviews
**Learning:** When dynamic UI panels load and result in no items, a clear, helpful empty state (with `role="status"`) prevents user confusion and improves accessibility.
**Action:** Always provide an empty state when loading is complete but no items are available.

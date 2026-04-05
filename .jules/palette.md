## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.
## 2025-02-12 - Accessible dynamic pre elements
**Learning:** When making dynamically generated `<pre>` elements scrollable via `tabindex="0"`, assign `role="group"` and a contextual `aria-label` (e.g., `aria-label="Code suggestion"`). Avoid using `role="region"` for multiple instances of the same element (like code suggestion panels) to prevent landmark pollution for screen reader users.
**Action:** Use `role="group"` and an `aria-label` when making code suggestions scrollable.

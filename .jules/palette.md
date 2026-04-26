## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-04-26 - Add ARIA group role to focusable pre elements
**Learning:** Dynamically generated focusable `<pre>` elements must be assigned `role="group"` and an `aria-label` to ensure screen readers name the element correctly when navigating via keyboard focus, instead of improperly overriding the inner text content or ignoring it.
**Action:** Always assign `role="group"` alongside an `aria-label` to structural containers (like `<pre>` blocks) when making them focusable using `tabIndex = 0`.

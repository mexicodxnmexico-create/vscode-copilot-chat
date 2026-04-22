## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-04-22 - Focusable pre Accessibility
**Learning:** When assigning an `aria-label` to dynamically generated focusable elements like `<pre>`, always pair it with `role="group"`. This ensures the `aria-label` names the group container instead of improperly overriding the actual inner text content for screen readers.
**Action:** Add `role="group"` alongside `aria-label` on dynamically focusable `<pre>` elements.

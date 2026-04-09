## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.
## 2024-03-09 - Accessibility of focusable dynamic pre elements - Revisited
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` should not use `role="region"`, which could lead to landmark pollution. Instead, we should assign `role="group"` and `aria-label="Code suggestion"`. We should still provide `title="Use arrow keys to scroll"` for keyboard interaction context.
**Action:** Always assign `role="group"` and a contextual `aria-label` (e.g. `aria-label="Code suggestion"`) to dynamically generated focusable `<pre>` elements.

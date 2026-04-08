## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-04-08 - Accessible dynamically generated interactive elements in Webviews
**Learning:** Overloading `aria-label` with instructional text pollutes the accessible name for screen readers, and scrollable regions require structural roles. Using `aria-description` cleanly separates supplementary instructions, while `role="group"` and a concise `aria-label` properly contextualize dynamically injected focusable elements.
**Action:** Always favor `aria-description` for supplementary instructions over verbose `aria-label`s, and apply `role="group"` with an `aria-label` to scrollable interactive regions like `<pre>` to ensure robust screen reader compatibility.

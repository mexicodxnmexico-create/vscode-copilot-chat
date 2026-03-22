## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.
## 2024-03-22 - Region role for scrollable `<pre>` tags
**Learning:** Dynamically generated scrollable elements (like `<pre>`) need more than just `tabindex="0"` for accessibility; they need `role="region"` to be properly identified by screen readers when focused.
**Action:** When adding keyboard scrollability to elements in VS Code webviews, ensure `role="region"` and an accessible name (like `title`) are present so screen readers announce them properly.

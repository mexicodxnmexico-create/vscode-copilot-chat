## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2024-03-12 - Preserving screen reader context in dynamic loading containers
**Learning:** In VS Code webviews, when updating loading states or dynamic content, avoid overwriting the `textContent` or `innerHTML` of a container that holds semantic child elements (like `<progress>` or `<label>`). This prevents destroying the elements and creating broken screen reader contexts (e.g., dangling `aria-describedby` references).
**Action:** Instead of overwriting container content, individually update text nodes and toggle CSS visibility (`display: none`) of semantic children.

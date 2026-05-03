## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.
## 2026-05-03 - Avoid outline: none on focusable elements in webviews
**Learning:** Removing the default focus outline using `outline: none;` on focusable elements like `pre:focus-visible` inside webviews impairs keyboard accessibility and visibility for users relying on keyboard navigation.
**Action:** Always provide an explicit outline (e.g., `outline: 1px solid var(--vscode-focusBorder);`) when styling focus states for webviews to maintain keyboard accessibility.
## 2026-05-03 - Add helpful empty states for dynamic content
**Learning:** Empty states in dynamic UI panels that display no results without any visual feedback can leave users confused about whether an error occurred or the process simply returned nothing.
**Action:** Always provide a clear, helpful empty state (e.g., using `role="status"`) with an explanation and call-to-action when a dynamic list returns zero results.

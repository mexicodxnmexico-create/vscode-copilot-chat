## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2024-05-15 - ARIA attributes on buttons
**Learning:** Adding an `aria-label` that exactly matches the visible text of a button is redundant and can violate WCAG 2.5.3 (Label in Name) if it omits or alters the visible text inappropriately. When providing supplementary instructional context to a text button, use `aria-description` instead, and ensure it is allowed in DOMPurify's `ADD_ATTR` configuration.
**Action:** Use `aria-description` instead of `aria-label` for supplementary instructions on text buttons and add 'aria-description' to DOMPurify.

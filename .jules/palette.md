## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.
## 2026-04-06 - Redundant aria-label replacement
**Learning:** Adding an aria-label that exactly matches the visible text of a button is redundant. When providing additional instructional context to a text button, do not replace or omit the visible text in the aria-label (violates WCAG 2.5.3 Label in Name). Instead, use the aria-description attribute for the supplementary instruction.
**Action:** Replaced redundant aria-label with aria-description on accept buttons in suggestionsPanelWebview.

## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2024-03-09 - Keyboard Navigation Wrap Around and Focus Sequence
**Learning:** When implementing sequential keyboard navigation for a list of items (e.g., Next/Previous shortcuts), initializing the focus index tracking state to `0` causes the first 'Next' navigation action to skip the first item. Additionally, users expect both 'Next' and 'Previous' actions to implement consistent wrap-around logic for the list boundaries, avoiding stuck boundaries.
**Action:** Initialize the focus index tracking state to `-1` instead of `0`. This ensures the first 'Next' navigation action correctly resolves to index `0` and selects the first item instead of skipping it. Additionally, ensure both 'Next' and 'Previous' actions implement consistent wrap-around logic.

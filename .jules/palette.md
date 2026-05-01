## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-05-01 - Add Focus Indicators for Accessibility
**Learning:** Found that `<pre>` elements storing code snippets in the Suggestions Panel didn't have focus rings, which made keyboard navigation difficult. The keyboard accessibility is important, especially for components that are natively scrollable and might receive focus.
**Action:** Add CSS rules for `:focus-visible` to ensure a visible outline is drawn when navigated by keyboard but hidden on mouse clicks, enhancing keyboard accessibility without degrading mouse user experience.

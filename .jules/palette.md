## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-04-12 - Adding accessibility attributes to dynamically generated scrollable pre elements
**Learning:** Making dynamically generated `<pre>` elements scrollable via `tabindex="0"` requires assigning `role="group"` and a contextual `aria-label` (e.g., `aria-label="Code suggestion"`). Avoiding `role="region"` prevents landmark pollution for multiple instances.
**Action:** When adding `tabindex="0"` to elements for scrolling, ensure proper ARIA roles and labels are provided to improve screen reader experience.

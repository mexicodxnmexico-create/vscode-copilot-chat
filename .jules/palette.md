## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-04-10 - Adding role and aria-label to focusable dynamic pre elements
**Learning:** For screen reader accessibility, adding `role="group"` and `aria-label="Code suggestion"` (or appropriate label) to dynamically generated scrollable `<pre>` elements prevents landmark pollution while giving users context on what the focusable code region contains.
**Action:** When making `<pre>` elements scrollable via `tabindex="0"`, assign `role="group"` and a contextual `aria-label` (e.g., `aria-label="Code suggestion"`) to support screen readers, alongside `title="Use arrow keys to scroll"` for sighted keyboard users.

## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-04-25 - Empty States and Pluralization in Dynamic Webviews
**Learning:** Providing helpful empty states and correct string pluralization prevents a "broken" feel (e.g., blank panels, "1 Suggestions") and improves screen reader announcements (e.g., "No suggestions found" instead of "0 Suggestions").
**Action:** Always pluralize dynamic counts correctly and render clear, actionable empty states for lists with zero items.

## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-05-04 - Empty state for Suggestions Panel
**Learning:** When dynamic UI panels (like `suggestionsPanelWebview.ts`) display no results after loading is complete, always provide a clear, helpful empty state (e.g., using `role="status"`) with an explanation and a call-to-action to avoid user confusion.
**Action:** Explicitly check for zero-length data alongside loading completion indicators and inject a helpful `role="status"` empty state message instead of rendering a blank screen.

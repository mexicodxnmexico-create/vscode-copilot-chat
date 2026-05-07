## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-05-07 - Add empty state to Copilot suggestions webview
**Learning:** When dynamic UI panels (like `suggestionsPanelWebview.ts`) display no results after loading is complete, they must provide a clear, helpful empty state (e.g., using `role="status"`) with an explanation. Otherwise users might think it's still loading or broken.
**Action:** Always verify what happens when `results.length === 0` in dynamic views, and inject an accessible status message if missing.

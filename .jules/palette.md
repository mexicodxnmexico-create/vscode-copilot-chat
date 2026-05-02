## 2024-03-09 - Accessibility of focusable dynamic pre elements
**Learning:** Dynamically generated `<pre>` elements with `tabindex="0"` in webviews should provide context for screen readers to explain why they are focusable (e.g., that they are scrollable text regions), instead of relying solely on implicit focus behavior. `aria-label` shouldn't be used as it replaces content. `title="Use arrow keys to scroll"` provides keyboard interaction context.
**Action:** Always add `title="Use arrow keys to scroll"` to dynamic focusable `<pre>` elements in HTML strings to ensure keyboard interaction context.

## 2026-05-02 - Webview CSS Focus States
**Learning:** Injected webview CSS often strips outlines using `outline: none;` on focusable elements like `<pre>`, which breaks keyboard accessibility. We must explicitly define visible outlines (e.g., `1px solid var(--vscode-focusBorder);`) for focus states.
**Action:** Always verify `focus-visible` rules in webview HTML templates to ensure an explicit outline is provided.

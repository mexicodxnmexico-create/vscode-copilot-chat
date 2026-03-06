## 2023-10-27 - [Avoid redundant aria-labels or titles on textual buttons]
**Learning:** Adding a title or aria-label that exactly matches the visible text of a button is redundant and can cause screen readers to announce the text twice.
**Action:** Reserve title attributes for icon-only buttons or use them to provide *additional* contextual information (e.g., "Click to insert this suggestion into your code" instead of "Accept suggestion 1").

## 2023-11-01 - [Add scroll context to focusable code blocks]
**Learning:** In webview HTML strings, dynamically generated focusable structural elements (like `<pre tabindex='0'>`) should use `title='Use arrow keys to scroll'` rather than `aria-label`. This provides keyboard interaction context as a tooltip without overriding the element's actual textual content for screen readers.
**Action:** Always provide a `title` attribute explaining the interaction when adding `tabindex="0"` to a non-interactive semantic element like `<pre>` to ensure screen readers read the content and sighted users get context.

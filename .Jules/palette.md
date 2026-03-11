## 2023-10-27 - [Avoid redundant aria-labels or titles on textual buttons]
**Learning:** Adding a title or aria-label that exactly matches the visible text of a button is redundant and can cause screen readers to announce the text twice.
**Action:** Reserve title attributes for icon-only buttons or use them to provide *additional* contextual information (e.g., "Click to insert this suggestion into your code" instead of "Accept suggestion 1").

## $(date +%Y-%m-%d) - Preserve Semantic Loading State Structure
**Learning:** In VS Code webviews, replacing the `textContent` of a loading container element destroys all of its semantic children (such as `<label>` and `<progress>`). This breaks accessibility contexts like `aria-describedby` and prevents the UI from gracefully returning to a loading state later, as the structural elements are permanently lost and querying them will fail silently or throw errors.
**Action:** Always update the specific text nodes (e.g., `label.textContent`) inside structural components instead of overwriting the parent container's content. Use CSS `display: none` to visually hide dynamic elements (like a progress bar) when they are no longer needed, rather than removing them from the DOM entirely.

## 2025-02-17 - Accessibility in Webviews
**Learning:** Found a pattern where "Warning" labels were hidden from screen readers (`aria-hidden="true"`) despite being critical context for the following text. Also, `aria-busy` state was not being cleared in the suggestions panel webview.
**Action:** Always check `aria-hidden` usage on text elements that convey meaning. Ensure `aria-busy` is toggled off when loading completes.

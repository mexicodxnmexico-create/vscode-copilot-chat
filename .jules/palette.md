## 2026-02-20 - Suggestions Panel Accessibility
**Learning:** Webviews in VS Code extensions often manually manage DOM and focus. Loading states (`aria-busy`) must be explicitly toggled off when content is ready, otherwise screen readers may ignore updates or announce the region as busy.
**Action:** Always check `aria-busy` lifecycle in webview components and verify it is set to `false` upon completion.

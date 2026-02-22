## 2026-02-18 - Accessibility in VS Code Webviews
**Learning:** `aria-hidden="true"` on citation warnings in `suggestionsPanelWebview.ts` completely hid the warning context from screen reader users, who only heard the license message. Visual presentation (e.g., icons) must be backed by accessible text.
**Action:** When auditing webviews, check `aria-hidden` elements to ensure they don't contain critical information not conveyed otherwise. Ensure external links have `aria-label` describing the "new window" behavior and `rel="noopener noreferrer"`.

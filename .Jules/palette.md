## 2026-02-19 - Accessibility in Webviews
**Learning:** Found critical information ("Warning") hidden from screen readers via `aria-hidden="true"` in a webview component. This pattern of visual-only cues needs to be audited in other webviews.
**Action:** When reviewing webview HTML generation, always check that critical status indicators are accessible (e.g., using proper icons with alt text or visible text without aria-hidden).

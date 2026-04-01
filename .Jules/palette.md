## 2023-10-27 - [Avoid redundant aria-labels or titles on textual buttons]
**Learning:** Adding a title or aria-label that exactly matches the visible text of a button is redundant and can cause screen readers to announce the text twice.
**Action:** Reserve title attributes for icon-only buttons or use them to provide *additional* contextual information (e.g., "Click to insert this suggestion into your code" instead of "Accept suggestion 1").

## $(date +%Y-%m-%d) - [Use aria-description instead of replacing visible text]
**Learning:** Adding an `aria-label` that completely removes or modifies the visible text of a button is an anti-pattern that violates WCAG 2.5.3 (Label in Name), which requires the accessible name to contain the visible text.
**Action:** When a button already has visible text but needs additional instructional context (like "Click to insert..."), do not override the visible text with `aria-label`. Instead, use `aria-description` to provide the supplementary instruction, and ensure it is allowed in DOMPurify's `ADD_ATTR` array.

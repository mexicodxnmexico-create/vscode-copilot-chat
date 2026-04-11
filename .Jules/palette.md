## 2023-10-27 - [Avoid redundant aria-labels or titles on textual buttons]
**Learning:** Adding a title or aria-label that exactly matches the visible text of a button is redundant and can cause screen readers to announce the text twice.
**Action:** Reserve title attributes for icon-only buttons or use them to provide *additional* contextual information (e.g., "Click to insert this suggestion into your code" instead of "Accept suggestion 1").
## 2026-04-11 - [Scrollable pre elements need ARIA group and label]
**Learning:** When making dynamically generated `<pre>` elements scrollable via `tabindex="0"`, assign `role="group"` and a contextual `aria-label` (e.g., `aria-label="Code suggestion"`). Avoid using `role="region"` for multiple instances of the same element (like code suggestion panels) to prevent landmark pollution for screen reader users.
**Action:** Assign `role="group"` and a contextual `aria-label` when setting `tabIndex = 0` on `<pre>` elements.

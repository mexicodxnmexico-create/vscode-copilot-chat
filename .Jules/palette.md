## 2025-05-27 - [Hidden Warning Context]
**Learning:** Found a pattern where visual "Warning" labels were hidden from screen readers (`aria-hidden="true"`), causing context loss. The warning text was decorative visually but critical semantically.
**Action:** Ensure warning labels are accessible (e.g., remove `aria-hidden`, use semantic HTML like `<strong>`, or appropriate roles) and consistently use icons with text alternatives if needed.

## 2025-05-27 - [Hidden Decorative Icons]
**Learning:** Decorative icons (like `&#9888;` warning sign) can cause redundant screen reader announcements (e.g., "Warning sign Warning") if not hidden.
**Action:** Wrap decorative icons in `<span aria-hidden="true">` to hide them from assistive technology while keeping the semantic text visible.

## 2025-05-27 - [Live Region & External Links]
**Learning:** Dynamic content updates (like loading suggestions) need `aria-busy` management to prevent screen readers from announcing incomplete content. External links (`target="_blank"`) require `aria-label` or visual indicators to warn users about context change.
**Action:** Toggle `aria-busy="false"` only when content is fully loaded. Add descriptive `aria-label` (e.g., "(opens in a new window)") to all external links.

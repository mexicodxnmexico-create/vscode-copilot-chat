## 2025-05-27 - [Hidden Warning Context]
**Learning:** Found a pattern where visual "Warning" labels were hidden from screen readers (`aria-hidden="true"`), causing context loss. The warning text was decorative visually but critical semantically.
**Action:** Ensure warning labels are accessible (e.g., remove `aria-hidden`, use semantic HTML like `<strong>`, or appropriate roles) and consistently use icons with text alternatives if needed.

## 2026-02-24 - [Dynamic Content Accessibility]
**Learning:** Dynamic content updates (like loading suggestions) benefit from explicit `aria-busy` management to inform assistive technologies of state changes. Decorative text icons (like `&#9888;`) should be hidden from screen readers to avoid confusing announcements.
**Action:** Toggle `aria-busy` on containers during loading states. Wrap decorative text icons in `<span aria-hidden="true">` and ensure a clear, visible text label is present.

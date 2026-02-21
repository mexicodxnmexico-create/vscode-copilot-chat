# Palette's Journal

## 2025-02-22 - Improving Critical Warnings for Accessibility
**Learning:** Decorative text like "Warning" was hidden from screen readers using `aria-hidden="true"`, causing loss of context for critical messages. Visual cues alone are insufficient.
**Action:** When using icons or decorative labels for status messages, ensure the semantic meaning (e.g., "Warning:") is exposed to assistive technologies, either via visible text or `aria-label`. Avoid hiding text that conveys essential status information.

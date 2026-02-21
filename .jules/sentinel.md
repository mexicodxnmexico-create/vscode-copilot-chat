## 2024-03-24 - Reverse Tabnabbing in Webviews
**Vulnerability:** Found `target="_blank"` links in webviews without `rel="noopener noreferrer"`.
**Learning:** `DOMPurify` by default strips `target="_blank"`. If we want to allow it, we must configure `ADD_ATTR` and add a hook to ensure `rel="noopener noreferrer"` is present.
**Prevention:** Always check `DOMPurify` config when using external links in webviews.

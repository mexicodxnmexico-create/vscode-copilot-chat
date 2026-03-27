## 2024-05-24 - Reverse Tabnabbing in Webviews
**Vulnerability:** Reverse tabnabbing vulnerability due to DOMPurify removing `rel="noopener noreferrer"` attributes from `target="_blank"` links.
**Learning:** DOMPurify strips the `rel` attribute unless explicitly allowed in `ADD_ATTR` array or injected via hooks, which exposes webviews to phishing attacks if they render external URLs.
**Prevention:** When using `DOMPurify.sanitize` to allow `target="_blank"` links, always use `DOMPurify.addHook('afterSanitizeAttributes', ...)` to securely inject `rel="noopener noreferrer"` back into the anchor tag.

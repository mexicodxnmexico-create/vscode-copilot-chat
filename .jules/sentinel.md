## 2025-02-27 - DOMPurify Configuration Gaps
**Vulnerability:** Found `DOMPurify.sanitize` usage that stripped `target="_blank"` attributes from external links, leading to broken functionality and potentially confusing behavior. Also, the external links lacked `rel="noopener noreferrer"`, which `DOMPurify` would strip if `target` was stripped, but if `target` was allowed, it would be vulnerable to reverse tabnabbing.
**Learning:** `DOMPurify` by default is very strict and strips `target` attributes. To allow them, `ADD_ATTR: ['target']` is needed. However, allowing `target` introduces tabnabbing risks, so `rel="noopener noreferrer"` MUST be added and preserved.
**Prevention:** When using `DOMPurify` for webviews, always check if `target="_blank"` is intended. If so, configure `DOMPurify` to allow `target` and ensure `rel="noopener noreferrer"` is present. Use explicit `DOMPurify` configuration rather than relying on defaults.

## 2025-02-27 - Process Environment Variable Leakage
**Vulnerability:** The `CommandExecutor` class in `src/extension/mcp/vscode-node/util.ts` propagated the full `process.env` to child processes (e.g., via `cp.spawn`), creating a potential security risk for environment variable leakage of extension-specific secrets (e.g., IPC hooks, auth tokens) to external tools and MCP servers.
**Learning:** Blindly passing `{ ...process.env }` to child processes can inadvertently leak sensitive context information, but over-aggressively stripping all environment variables (like `TOKEN` or `PASSWORD`) breaks underlying authorized tool functionality (like custom NuGet sources or GitHub CLI).
**Prevention:** Rather than a blanket filter of all variables matching generic terms, specifically filter out framework/application-specific secrets (e.g., variables starting with `VSCODE_`, `GITHUB_`, or `COPILOT_`). Additionally, APIs that spawn processes should accept an explicit `env` parameter to allow intentional overrides by callers.
## 2024-03-24 - [Insecure Nonce Generation]
**Vulnerability:** Weak, non-cryptographic nonce generation using Math.random() in a Webview CSP.
**Learning:** Math.random() shouldn't be used to secure applications as it is predictable. Webviews CSP must be robust to mitigate XSS correctly.
**Prevention:** Use cryptographically secure methods like crypto.randomUUID() or crypto.getRandomValues() (provided globally in VS Code via base utils) when generating nonces or random security identifiers.

## 2025-02-27 - Reverse Tabnabbing Vulnerability via DOMPurify Config
**Vulnerability:** Found `DOMPurify` configuration missing `rel` in its `ADD_ATTR` list while `target` was allowed. The application explicitly added `rel="noopener noreferrer"` to anchors to prevent reverse tabnabbing, but because `rel` wasn't explicitly allowed by `DOMPurify`, it stripped the attribute when sanitizing.
**Learning:** `DOMPurify` requires explicit whitelisting for security-critical attributes. When `target="_blank"` is allowed, the accompanying `rel="noopener noreferrer"` must also be permitted through `ADD_ATTR: ['rel']`, otherwise the intended protection is stripped silently.
**Prevention:** Whenever configuring `DOMPurify` to allow `target`, always include `rel` in the `ADD_ATTR` configuration. Ensure a comment is placed nearby explaining the relationship between `target` and `rel` to prevent future regressions.

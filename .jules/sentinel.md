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
## 2024-05-24 - Command Injection via shell: true in copilotCLIShim

**Vulnerability:** The `spawnSync` call in `src/extension/chatSessions/vscode-node/copilotCLIShim.ts` used `{ shell: true }` when executing `copilot --version`. This could potentially allow command injection if any part of the command string were user-controlled, or it could simply be flagged by static analysis tools.

**Learning:** Using `shell: true` with `child_process.spawn` or `child_process.spawnSync` is a common source of command injection vulnerabilities because it passes the command to the system shell for evaluation, which interprets shell metacharacters.

**Prevention:** Always avoid `shell: true` unless absolutely necessary. Instead, pass the executable and its arguments as a separate array to `spawnSync` (e.g., `spawnSync('copilot', ['--version'], ...)`). This ensures the arguments are passed directly to the executable without shell interpretation.

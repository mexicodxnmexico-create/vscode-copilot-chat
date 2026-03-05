## 2025-02-13 - Insecure Randomness in copilotCLIImageSupport.ts
**Vulnerability:** Use of `Math.random().toString(36)` to generate 8-character identifiers for file naming.
**Learning:** `Math.random()` is not cryptographically secure and is highly predictable, making it unsuitable for generating sensitive IDs, tokens, or unique filenames that might be susceptible to enumeration or collision.
**Prevention:** Avoid `Math.random()` for identifier generation. Use `generateUuid()` from `src/util/vs/base/common/uuid.ts`, which relies on cryptographically secure pseudorandom number generators (e.g., `crypto.getRandomValues`). Extract substrings from UUIDs when shorter formats are required (e.g., `generateUuid().substring(0, 8)`).

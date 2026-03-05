## 2025-03-08 - Insecure Randomness for Identifier
**Vulnerability:** Used `Math.random().toString(36)` to generate a token that becomes part of an image's filename.
**Learning:** `Math.random()` provides predictable randomness which should never be used where collision resistance or security token traits are needed.
**Prevention:** Always use cryptographically secure utilities like `crypto.randomUUID()` or existing codebase helpers like `generateUuid()` from `uuid.ts` when building identifiers for files, nonces, or secrets.

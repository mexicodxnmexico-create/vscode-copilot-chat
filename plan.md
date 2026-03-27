1. **Optimize `convertToAPIJsonData` in `stream.ts`**
   - In `src/extension/completions-core/vscode-node/lib/src/openai/stream.ts`, replace the inefficient array flattening logic using `reduce` and `concat` with `flat()` method.
   - This prevents quadratic time complexity $O(n^2)$ associated with repeatedly creating new arrays inside `reduce` + `concat`, dramatically speeding up the parsing of long API completions with logprobs.
2. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
3. **Submit the change.**

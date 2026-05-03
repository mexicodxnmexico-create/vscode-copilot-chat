1. **Optimize PR Fetches (`getPullRequestFromGlobalId`)**
   - In `src/extension/chatSessions/vscode-node/copilotCloudSessionsProvider.ts`
   - Modify the `Promise.all` logic fetching PRs for `uniqueGlobalIds` (around line 1007).
   - Unbounded iterables with API requests shouldn't be executed sequentially in a `Promise.all()`.
   - Batch these requests using a simple loop to limit concurrent connections, solving the scalability regression.

2. **Optimize `sessionItems` building (`getFileChangesMultiDiffPart`)**
   - In `src/extension/chatSessions/vscode-node/copilotCloudSessionsProvider.ts`
   - Modify the `Promise.all` logic mapping `latestSessionsMap.values()` (around line 1030).
   - This block makes API calls via `getFileChangesMultiDiffPart`.
   - Batch these operations to limit concurrency to a manageable size (`BATCH_SIZE=5`).

3. **Add Learning to `.jules/bolt.md`**
   - Record learning about `Promise.all()` with large unbound iterables and concurrent I/O operations causing regressions, and to use batching instead.

4. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. Create PR with appropriate title and description.

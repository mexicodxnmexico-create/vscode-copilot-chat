const fs = require('fs');
const filePath = 'src/extension/chatSessions/vscode-node/copilotCloudSessionsProvider.ts';
let content = fs.readFileSync(filePath, 'utf8');

const search1 = `			// Fetch PRs for all unique resource_global_ids in parallel
			const uniqueGlobalIds = new Set(Array.from(latestSessionsMap.values()).map(s => s.resource_global_id));
			const prFetches = Array.from(uniqueGlobalIds).map(async globalId => {
				const pr = await this._octoKitService.getPullRequestFromGlobalId(globalId, { createIfNone: false });
				return { globalId, pr };
			});
			const prResults = await Promise.all(prFetches);`;

const replace1 = `			// Fetch PRs for all unique resource_global_ids in parallel
			const uniqueGlobalIds = Array.from(new Set(Array.from(latestSessionsMap.values()).map(s => s.resource_global_id)));

			// ⚡ Bolt: Batch Promise.all API calls to prevent thousands of concurrent I/O requests scalability regression
			const prResults = [];
			const PR_BATCH_SIZE = 5;
			for (let i = 0; i < uniqueGlobalIds.length; i += PR_BATCH_SIZE) {
				const batch = uniqueGlobalIds.slice(i, i + PR_BATCH_SIZE);
				const batchResults = await Promise.all(batch.map(async globalId => {
					const pr = await this._octoKitService.getPullRequestFromGlobalId(globalId, { createIfNone: false });
					return { globalId, pr };
				}));
				prResults.push(...batchResults);
			}`;

const search2 = `			// Create session items from latest sessions
			const sessionItems = await Promise.all(Array.from(latestSessionsMap.values()).map(async sessionItem => {`;

const replace2 = `			// Create session items from latest sessions
			const latestSessionsArray = Array.from(latestSessionsMap.values());
			const sessionItems = [];
			const SESSION_BATCH_SIZE = 5;

			// ⚡ Bolt: Batch Promise.all API calls for file changes diff part to prevent concurrent connection limits
			for (let i = 0; i < latestSessionsArray.length; i += SESSION_BATCH_SIZE) {
				const batch = latestSessionsArray.slice(i, i + SESSION_BATCH_SIZE);
				const batchResults = await Promise.all(batch.map(async sessionItem => {`;

const search3 = `					pullRequestDetails: pr
				} satisfies vscode.ChatSessionItem & {
					fullDatabaseId: string;
					pullRequestDetails: PullRequestSearchItem;
				};
				this.chatSessions.set(pr.number, pr);
				return session;
			}));`;

const replace3 = `					pullRequestDetails: pr
				} satisfies vscode.ChatSessionItem & {
					fullDatabaseId: string;
					pullRequestDetails: PullRequestSearchItem;
				};
				this.chatSessions.set(pr.number, pr);
				return session;
				}));
				sessionItems.push(...batchResults);
			}`;

content = content.replace(search1, replace1).replace(search2, replace2).replace(search3, replace3);
fs.writeFileSync(filePath, content, 'utf8');

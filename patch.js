const fs = require('fs');
const file = 'src/extension/chatSessions/vscode-node/claudeChatSessionContentProvider.ts';
let content = fs.readFileSync(file, 'utf8');

const search = `	private async _buildModelIdMap(session: IClaudeCodeSession): Promise<ReadonlyMap<string, string>> {
		const sdkModelIds = collectSdkModelIds(session);
		const map = new Map<string, string>();
		for (const sdkModelId of sdkModelIds) {
			const endpointModelId = await this.claudeCodeModels.mapSdkModelToEndpointModel(sdkModelId);
			if (endpointModelId) {
				map.set(sdkModelId, endpointModelId);
			}
		}
		return map;
	}`;

const replace = `	private async _buildModelIdMap(session: IClaudeCodeSession): Promise<ReadonlyMap<string, string>> {
		const sdkModelIds = collectSdkModelIds(session);
		const map = new Map<string, string>();
		await Promise.all(Array.from(sdkModelIds).map(async (sdkModelId) => {
			const endpointModelId = await this.claudeCodeModels.mapSdkModelToEndpointModel(sdkModelId);
			if (endpointModelId) {
				map.set(sdkModelId, endpointModelId);
			}
		}));
		return map;
	}`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('Successfully patched the file.');
} else {
    console.log('Could not find the search string.');
}

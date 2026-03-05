const fs = require('fs');
const filePath = 'src/extension/chatSessions/claude/vscode-node/slashCommands/hooksCommand.ts';
let code = fs.readFileSync(filePath, 'utf8');

const oldMatchersCode = `	private async _getExistingMatchersWithSource(event: HookEventId): Promise<MatcherWithSource[]> {
		const matchers: MatcherWithSource[] = [];
		const allLocations = this._getAllSettingsLocations();

		for (const location of allLocations) {
			try {
				const settings = await this._loadSettings(location.settingsPath);
				if (settings.hooks?.[event]) {
					for (const matcherConfig of settings.hooks[event]!) {
						// Check if we already have this matcher from a higher-priority location
						const existing = matchers.find(m => m.matcher === matcherConfig.matcher);
						if (!existing) {
							matchers.push({
								matcher: matcherConfig.matcher,
								location,
							});
						}
					}
				}
			} catch {
				// Ignore errors, settings file might not exist
			}
		}

		return matchers;
	}`;

const newMatchersCode = `	private async _getExistingMatchersWithSource(event: HookEventId): Promise<MatcherWithSource[]> {
		const matchers: MatcherWithSource[] = [];
		const allLocations = this._getAllSettingsLocations();

		const loadedSettings = await Promise.all(
			allLocations.map(async (location) => {
				try {
					const settings = await this._loadSettings(location.settingsPath);
					return { location, settings };
				} catch {
					return { location, settings: {} as HooksSettings };
				}
			})
		);

		for (const { location, settings } of loadedSettings) {
			if (settings.hooks?.[event]) {
				for (const matcherConfig of settings.hooks[event]!) {
					// Check if we already have this matcher from a higher-priority location
					const existing = matchers.find(m => m.matcher === matcherConfig.matcher);
					if (!existing) {
						matchers.push({
							matcher: matcherConfig.matcher,
							location,
						});
					}
				}
			}
		}

		return matchers;
	}`;

if (code.includes(oldMatchersCode)) {
    code = code.replace(oldMatchersCode, newMatchersCode);
    fs.writeFileSync(filePath, code);
    console.log("Successfully replaced _getExistingMatchersWithSource");
} else {
    console.log("Could not find the original _getExistingMatchersWithSource code");
}

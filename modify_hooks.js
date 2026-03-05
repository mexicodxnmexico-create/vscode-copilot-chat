const fs = require('fs');
const filePath = 'src/extension/chatSessions/claude/vscode-node/slashCommands/hooksCommand.ts';
let code = fs.readFileSync(filePath, 'utf8');

const oldHooksCode = `	private async _getExistingHooksWithSource(event: HookEventId, matcher: string): Promise<HookWithSource[]> {
		const hooks: HookWithSource[] = [];
		const allLocations = this._getAllSettingsLocations();

		for (const location of allLocations) {
			try {
				const settings = await this._loadSettings(location.settingsPath);
				if (settings.hooks?.[event]) {
					const matcherConfig = settings.hooks[event]!.find(m => m.matcher === matcher);
					if (matcherConfig) {
						for (const hook of matcherConfig.hooks) {
							hooks.push({
								command: hook.command,
								location,
							});
						}
					}
				}
			} catch {
				// Ignore errors, settings file might not exist
			}
		}

		return hooks;
	}`;

const newHooksCode = `	private async _getExistingHooksWithSource(event: HookEventId, matcher: string): Promise<HookWithSource[]> {
		const hooks: HookWithSource[] = [];
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
				const matcherConfig = settings.hooks[event]!.find(m => m.matcher === matcher);
				if (matcherConfig) {
					for (const hook of matcherConfig.hooks) {
						hooks.push({
							command: hook.command,
							location,
						});
					}
				}
			}
		}

		return hooks;
	}`;

if (code.includes(oldHooksCode)) {
    code = code.replace(oldHooksCode, newHooksCode);
    fs.writeFileSync(filePath, code);
    console.log("Successfully replaced _getExistingHooksWithSource");
} else {
    console.log("Could not find the original _getExistingHooksWithSource code");
}

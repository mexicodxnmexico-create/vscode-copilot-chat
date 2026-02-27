/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	BasePromptElementProps,
	PromptElement,
	PromptElementProps,
	PromptSizing,
} from '@vscode/prompt-tsx';
import {
	ConfigKey,
	IConfigurationService,
} from '../../../platform/configuration/common/configurationService';
import { IVSCodeExtensionContext } from '../../../platform/extContext/common/extensionContext';
import { IFileSystemService } from '../../../platform/filesystem/common/fileSystemService';
import { FileType } from '../../../platform/filesystem/common/fileTypes';
import { IExperimentationService } from '../../../platform/telemetry/common/nullExperimentationService';
import { ITelemetryService } from '../../../platform/telemetry/common/telemetry';
import { URI } from '../../../util/vs/base/common/uri';
import { Tag } from '../../prompts/node/base/tag';
import {
	IAgentMemoryService,
	normalizeCitations,
	RepoMemoryEntry,
} from '../common/agentMemoryService';
import { ToolName } from '../common/toolNames';
import { extractSessionId } from './memoryTool';

const MEMORY_BASE_DIR = 'memory-tool/memories';
const MAX_USER_MEMORY_LINES = 200;

export interface MemoryContextPromptProps extends BasePromptElementProps {
	readonly sessionResource?: string;
}

export class MemoryContextPrompt extends PromptElement<MemoryContextPromptProps> {
	constructor(
		props: any,
		@IAgentMemoryService
		private readonly agentMemoryService: IAgentMemoryService,
		@IConfigurationService
		private readonly configurationService: IConfigurationService,
		@IExperimentationService
		private readonly experimentationService: IExperimentationService,
		@IVSCodeExtensionContext
		private readonly extensionContext: IVSCodeExtensionContext,
		@IFileSystemService
		private readonly fileSystemService: IFileSystemService,
		@ITelemetryService private readonly telemetryService: ITelemetryService,
	) {
		super(props);
	}

	async render() {
		const enableCopilotMemory =
			this.configurationService.getExperimentBasedConfig(
				ConfigKey.CopilotMemoryEnabled,
				this.experimentationService,
			);
		const enableMemoryTool =
			this.configurationService.getExperimentBasedConfig(
				ConfigKey.MemoryToolEnabled,
				this.experimentationService,
			);

		const userMemoryContent = enableMemoryTool
			? await this.getUserMemoryContent()
			: undefined;
		const sessionMemoryFiles = enableMemoryTool
			? await this.getSessionMemoryFiles(this.props.sessionResource)
			: undefined;
		const repoMemories = enableCopilotMemory
			? await this.agentMemoryService.getRepoMemories()
			: undefined;
		const localRepoMemoryFiles =
			enableMemoryTool && !enableCopilotMemory
				? await this.getLocalRepoMemoryFiles()
				: undefined;

		if (!enableMemoryTool && !enableCopilotMemory) {
			return null;
		}

		this._sendContextReadTelemetry(
			!!userMemoryContent,
			userMemoryContent?.length ?? 0,
			sessionMemoryFiles?.length ?? 0,
			sessionMemoryFiles?.join('\n').length ?? 0,
			repoMemories?.length ?? 0,
			repoMemories ? this.formatMemories(repoMemories).length : 0,
		);

		return (
			<>
				{enableMemoryTool && (
					<Tag name="userMemory">
						{userMemoryContent ? (
							<>
								The following are your persistent user memory<br />
								notes. These persist across all workspaces and<br />
								conversations.<br />
								<br />
								<br />
								{userMemoryContent}
							</>
						) : (
							<>
								No user preferences or notes saved yet. Use the{' '}
								{ToolName.Memory} tool to store persistent notes<br />
								under /memories/.<br />
							</>
						)}
					</Tag>
				)}
				{enableMemoryTool && (
					<Tag name="sessionMemory">
						{sessionMemoryFiles && sessionMemoryFiles.length > 0 ? (
							<>
								The following files exist in your session memory
								(/memories/session/). Use the {ToolName.Memory}{' '}
								tool to read them if needed.
								<br />
								<br />
								{sessionMemoryFiles.join('\n')}
							</>
						) : (
							<>
								Session memory (/memories/session/) is empty. No<br />
								session notes have been created yet.<br />
							</>
						)}
					</Tag>
				)}
				{enableMemoryTool && !enableCopilotMemory && (
					<Tag name="repoMemory">
						{localRepoMemoryFiles &&
						localRepoMemoryFiles.length > 0 ? (
								<>
								The following files exist in your repository<br />
								memory (/memories/repo/). These are scoped to<br />
								the current workspace. Use the {ToolName.Memory}{' '}
								tool to read them if needed.
									<br />
									<br />
									{localRepoMemoryFiles.join('\n')}
								</>
							) : (
								<>
								Repository memory (/memories/repo/) is empty. No<br />
								workspace-scoped notes have been created yet.<br />
								</>
							)}
					</Tag>
				)}
				{repoMemories && repoMemories.length > 0 && (
					<Tag name="repository_memories">
						The following are recent memories stored for this<br />
						repository from previous agent interactions. These<br />
						memories may contain useful context about the codebase<br />
						conventions, patterns, and practices. However, be aware<br />
						that memories might be obsolete or incorrect or may not<br />
						apply to your current task. Use the citations provided<br />
						to verify the accuracy of any relevant memory before<br />
						relying on it.<br />
						<br />
						<br />
						{this.formatMemories(repoMemories)}
						<br />
						Be sure to consider these stored facts carefully.<br />
						Consider whether any are relevant to your current task.<br />
						If they are, verify their current applicability before<br />
						using them to inform your work.<br />
						<br />
						<br />
						If you come across a memory that you're able to verify
						and that you find useful, you should use the{' '}
						{ToolName.Memory} tool to store the same fact again.<br />
						Only recent memories are retained, so storing the fact<br />
						again will cause it to be retained longer.<br />
						<br />
						If you come across a fact that's incorrect or outdated,
						you should use the {ToolName.Memory} tool to store a new<br />
						fact that reflects the current reality.<br />
						<br />
					</Tag>
				)}
			</>
		);
	}

	private async getUserMemoryContent(): Promise<string | undefined> {
		const globalStorageUri = this.extensionContext.globalStorageUri;
		if (!globalStorageUri) {
			return undefined;
		}
		const memoryDirUri = URI.joinPath(globalStorageUri, MEMORY_BASE_DIR);
		try {
			const stat = await this.fileSystemService.stat(memoryDirUri);
			if (stat.type !== FileType.Directory) {
				return undefined;
			}
		} catch {
			return undefined;
		}

		const entries =
			await this.fileSystemService.readDirectory(memoryDirUri);
		const fileEntries = entries.filter(
			([name, type]) => type === FileType.File && !name.startsWith('.'),
		);
		if (fileEntries.length === 0) {
			return undefined;
		}

		const lines: string[] = [];
		for (const [name] of fileEntries) {
			if (lines.length >= MAX_USER_MEMORY_LINES) {
				break;
			}
			const fileUri = URI.joinPath(memoryDirUri, name);
			try {
				const content = await this.fileSystemService.readFile(fileUri);
				const text = new TextDecoder().decode(content);
				lines.push(`## ${name}`, ...text.split('\n'));
			} catch {
				// Skip unreadable files
			}
		}

		if (lines.length === 0) {
			return undefined;
		}

		return lines.slice(0, MAX_USER_MEMORY_LINES).join('\n');
	}

	private async getSessionMemoryFiles(
		sessionResource?: string,
	): Promise<string[] | undefined> {
		const storageUri = this.extensionContext.storageUri;
		if (!storageUri || !sessionResource) {
			return undefined;
		}
		// Use the same logic as the memory tool to resolve the current session directory
		const sessionId = extractSessionId(sessionResource);
		const sessionDirUri = URI.joinPath(
			URI.from(storageUri),
			MEMORY_BASE_DIR,
			sessionId,
		);
		try {
			const stat = await this.fileSystemService.stat(sessionDirUri);
			if (stat.type !== FileType.Directory) {
				return undefined;
			}
		} catch {
			return undefined;
		}

		const files: string[] = [];
		const entries =
			await this.fileSystemService.readDirectory(sessionDirUri);
		for (const [fileName, fileType] of entries) {
			if (fileType === FileType.File && !fileName.startsWith('.')) {
				files.push(`/memories/session/${fileName}`);
			}
		}

		return files.length > 0 ? files : undefined;
	}

	private async getLocalRepoMemoryFiles(): Promise<string[] | undefined> {
		const storageUri = this.extensionContext.storageUri;
		if (!storageUri) {
			return undefined;
		}
		const repoDirUri = URI.joinPath(
			URI.from(storageUri),
			MEMORY_BASE_DIR,
			'repo',
		);
		try {
			const stat = await this.fileSystemService.stat(repoDirUri);
			if (stat.type !== FileType.Directory) {
				return undefined;
			}
		} catch {
			return undefined;
		}

		const files: string[] = [];
		const entries = await this.fileSystemService.readDirectory(repoDirUri);
		for (const [fileName, fileType] of entries) {
			if (fileType === FileType.File && !fileName.startsWith('.')) {
				files.push(`/memories/repo/${fileName}`);
			}
		}

		return files.length > 0 ? files : undefined;
	}

	private formatMemories(memories: RepoMemoryEntry[]): string {
		return memories
			.map((m) => {
				const lines = [`**${m.subject}**`, `- Fact: ${m.fact}`];

				// Format citations (handle both string and string[] formats)
				if (m.citations) {
					const citationsArray =
						normalizeCitations(m.citations) ?? [];
					if (citationsArray.length > 0) {
						lines.push(`- Citations: ${citationsArray.join(', ')}`);
					}
				}

				// Include reason if present (from CAPI format)
				if (m.reason) {
					lines.push(`- Reason: ${m.reason}`);
				}

				return lines.join('\n');
			})
			.join('\n\n');
	}

	private _sendContextReadTelemetry(
		hasUserMemory: boolean,
		userMemoryLength: number,
		sessionFileCount: number,
		sessionMemoryLength: number,
		repoMemoryCount: number,
		repoMemoryLength: number,
	): void {
		/* __GDPR__
			"memoryContextRead" : {
				"owner": "digitarald",
				"comment": "Tracks automatic memory context reads during prompt construction",
				"hasUserMemory": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "comment": "Whether user memory content was loaded" },
				"userMemoryLength": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true, "comment": "String length of user memory content" },
				"sessionFileCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true, "comment": "Number of session memory files listed" },
				"sessionMemoryLength": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true, "comment": "String length of session memory file listing" },
				"repoMemoryCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true, "comment": "Number of repository memories fetched" },
				"repoMemoryLength": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true, "comment": "String length of formatted repository memories" }
			}
		*/
		this.telemetryService.sendMSFTTelemetryEvent(
			'memoryContextRead',
			{
				hasUserMemory: String(hasUserMemory),
			},
			{
				userMemoryLength,
				sessionFileCount,
				sessionMemoryLength,
				repoMemoryCount,
				repoMemoryLength,
			},
		);
	}
}

/**
 * Prompt component that provides comprehensive instructions for using the memory tool.
 * Covers all three memory tiers: user, session, and repository.
 */
export class MemoryInstructionsPrompt extends PromptElement<BasePromptElementProps> {
	constructor(
		props: PromptElementProps<BasePromptElementProps>,
		@IConfigurationService
		private readonly configurationService: IConfigurationService,
		@IExperimentationService
		private readonly experimentationService: IExperimentationService,
	) {
		super(props);
	}

	async render(state: void, sizing: PromptSizing) {
		const enableCopilotMemory =
			this.configurationService.getExperimentBasedConfig(
				ConfigKey.CopilotMemoryEnabled,
				this.experimentationService,
			);
		const enableMemoryTool =
			this.configurationService.getExperimentBasedConfig(
				ConfigKey.MemoryToolEnabled,
				this.experimentationService,
			);
		if (!enableCopilotMemory && !enableMemoryTool) {
			return null;
		}

		return (
			<Tag name="memoryInstructions">
				As you work, consult your memory files to build on previous<br />
				experience. When you encounter a mistake that seems like it<br />
				could be common, check your memory for relevant notes — and if<br />
				nothing is written yet, record what you learned.<br />
				<br />
				<br />
				<Tag name="memoryScopes">
					Memory is organized into the scopes defined below:
					<br />
					{enableMemoryTool && (
						<>
							- **User memory** (`/memories/`): Persistent notes<br />
							that survive across all workspaces and<br />
							conversations. Store user preferences, common<br />
							patterns, frequently used commands, and general<br />
							insights here. First {MAX_USER_MEMORY_LINES} lines<br />
							are loaded into your context automatically.<br />
							<br />
						</>
					)}
					{enableMemoryTool && (
						<>
							- **Session memory** (`/memories/session/`): Notes<br />
							for the current conversation only. Store<br />
							task-specific context, in-progress notes, and<br />
							temporary working state here. Session files are<br />
							listed in your context but not loaded automatically<br />
							— use the memory tool to read them when needed.<br />
							<br />
						</>
					)}
					{enableCopilotMemory && (
						<>
							- **Repository memory** (`/memories/repo/`):<br />
							Repository-scoped facts stored via Copilot. Only the<br />
							`create` command is supported. Store codebase<br />
							conventions, build commands, project structure<br />
							facts, and verified practices here.<br />
							<br />
						</>
					)}
					{enableMemoryTool && !enableCopilotMemory && (
						<>
							- **Repository memory** (`/memories/repo/`):<br />
							Repository-scoped facts stored locally in the<br />
							workspace. Store codebase conventions, build<br />
							commands, project structure facts, and verified<br />
							practices here.<br />
							<br />
						</>
					)}
				</Tag>
				<br />
				{enableMemoryTool && (
					<>
						<Tag name="memoryGuidelines">
							Guidelines for user memory (`/memories/`):
							<br />
							- Keep entries short and concise — use brief bullet<br />
							points or single-line facts, not lengthy prose. User<br />
							memory is loaded into context automatically, so<br />
							brevity is critical.<br />
							<br />
							- Organize by topic in separate files (e.g.,<br />
							`debugging.md`, `patterns.md`).<br />
							<br />
							- Record only key insights: problem constraints,<br />
							strategies that worked or failed, and lessons<br />
							learned.<br />
							<br />
							- Update or remove memories that turn out to be<br />
							wrong or outdated.<br />
							<br />
							- Do not create new files unless necessary — prefer<br />
							updating existing files.<br />
							<br />
							Guidelines for session memory<br />
							(`/memories/session/`):<br />
							<br />
							- Use session memory to keep plans up to date and<br />
							reviewing historical summaries.<br />
							<br />
							- Do not create unnecessary session memory files.<br />
							You should only view and update existing session<br />
							files.<br />
							<br />
						</Tag>
					</>
				)}
				<br />
				{enableCopilotMemory && (
					<>
						<Tag name="repoMemoryInstructions">
							If you come across an important fact about the<br />
							codebase that could help in future code review or<br />
							generation tasks, beyond the current task, use the{' '}
							{ToolName.Memory} tool to store it. Use the `create`<br />
							command with a path under `/memories/repo/` to store<br />
							repository-scoped facts. The file content should be<br />
							a JSON object with these fields: `subject`, `fact`,<br />
							`citations`, `reason`, and `category`.<br />
							<br />
							Facts may be gleaned from the codebase itself or<br />
							learned from user input or feedback. Such facts<br />
							might include:<br />
							<br />
							- Conventions, preferences, or best practices<br />
							specific to this codebase that might be overlooked<br />
							when inspecting only a limited code sample<br />
							<br />
							- Important information about the structure or logic<br />
							of the codebase<br />
							<br />
							- Commands for linting, building, or running tests<br />
							that have been verified through a successful run<br />
							<br />
							<Tag name="examples">
								- "Use ErrKind wrapper for every public API<br />
								error"<br />
								<br />
								- "Prefer ExpectNoLog helper over silent nil<br />
								checks in tests"<br />
								<br />
								- "Always use Python typing"
								<br />
								- "Follow the Google JavaScript Style Guide"
								<br />
								- "Use html_escape as a sanitizer to avoid cross<br />
								site scripting vulnerabilities"<br />
								<br />
								- "The code can be built with `npm run build`<br />
								and tested with `npm run test`"<br />
								<br />
							</Tag>
							Only store facts that meet the following criteria:
							<br />
							<Tag name="factsCriteria">
								- Are likely to have actionable implications for<br />
								a future task<br />
								<br />
								- Are independent of changes you are making as<br />
								part of your current task, and will remain<br />
								relevant if your current code isn't merged<br />
								<br />
								- Are unlikely to change over time
								<br />
								- Cannot always be inferred from a limited code<br />
								sample<br />
								<br />
								- Contain no secrets or sensitive data
								<br />
							</Tag>
							Always include the reason and citations fields.
							<br />
							Before storing, ask yourself: Will this help with<br />
							future coding or code review tasks across the<br />
							repository? If unsure, skip storing it.<br />
							<br />
							Note: Only `create` is supported for<br />
							`/memories/repo/` paths.<br />
							<br />
							If the user asks how to view or manage their repo<br />
							memories refer them to<br />
							https://docs.github.com/en/copilot/how-tos/use-copilot-agents/copilot-memory.<br />
							<br />
						</Tag>
					</>
				)}
			</Tag>
		);
	}
}

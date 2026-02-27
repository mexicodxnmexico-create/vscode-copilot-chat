/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as l10n from '@vscode/l10n';
import {
	BasePromptElementProps,
	PromptElement,
	PromptPiece,
	PromptSizing,
	SystemMessage,
	TextChunk,
	UserMessage,
} from '@vscode/prompt-tsx';
import type * as vscode from 'vscode';
import {
	ChatFetchResponseType,
	ChatLocation,
} from '../../../../platform/chat/common/commonTypes';
import {
	EmbeddingType,
	IEmbeddingsComputer,
} from '../../../../platform/embeddings/common/embeddingsComputer';
import {
	CommandListItem,
	ICombinedEmbeddingIndex,
	SettingListItem,
	settingItemToContext,
} from '../../../../platform/embeddings/common/vscodeIndex';
import { IEndpointProvider } from '../../../../platform/endpoint/common/endpointProvider';
import { IEnvService } from '../../../../platform/env/common/envService';
import { ILogService } from '../../../../platform/log/common/logService';
import { IChatEndpoint } from '../../../../platform/networking/common/networking';
import { IReleaseNotesService } from '../../../../platform/releaseNotes/common/releaseNotesService';
import { reportProgressOnSlowPromise } from '../../../../util/common/progress';
import { sanitizeVSCodeVersion } from '../../../../util/common/vscodeVersion';
import { IInstantiationService } from '../../../../util/vs/platform/instantiation/common/instantiation';
import { ChatResponseProgressPart } from '../../../../vscodeTypes';
import { Turn } from '../../../prompt/common/conversation';
import { IBuildPromptContext } from '../../../prompt/common/intents';
import { ToolName } from '../../../tools/common/toolNames';
import { CopilotIdentityRules } from '../base/copilotIdentity';
import { InstructionMessage } from '../base/instructionMessage';
import { PromptRenderer } from '../base/promptRenderer';
import { ResponseTranslationRules } from '../base/responseTranslationRules';
import { SafetyRules } from '../base/safetyRules';
import { Tag } from '../base/tag';
import { ChatToolReferences, ChatVariablesAndQuery } from './chatVariables';
import {
	ConversationHistoryWithTools,
	HistoryWithInstructions,
} from './conversationHistory';
import { ChatToolCalls } from './toolCalling';
import { UnsafeCodeBlock } from './unsafeElements';

export interface VscodePromptProps extends BasePromptElementProps {
	promptContext: IBuildPromptContext;
	endpoint: IChatEndpoint;
}

export interface VscodePromptState {
	settings: SettingListItem[];
	commands: CommandListItem[];
	query: string;
	releaseNotes?: { version: string; notes: string }[];
	currentVersion?: string;
}

export class VscodePrompt extends PromptElement<
	VscodePromptProps,
	VscodePromptState
> {
	constructor(
		props: VscodePromptProps,
		@ILogService private readonly logService: ILogService,
		@IEmbeddingsComputer
		private readonly embeddingsComputer: IEmbeddingsComputer,
		@IEndpointProvider private readonly endPointProvider: IEndpointProvider,
		@ICombinedEmbeddingIndex
		private readonly combinedEmbeddingIndex: ICombinedEmbeddingIndex,
		@IEnvService private readonly envService: IEnvService,
		@IInstantiationService
		private readonly instantiationService: IInstantiationService,
		@IReleaseNotesService
		private readonly releaseNotesService: IReleaseNotesService,
	) {
		super(props);
	}

	override async prepare(
		sizing: PromptSizing,
		progress: vscode.Progress<vscode.ChatResponseProgressPart> | undefined,
		token: vscode.CancellationToken,
	): Promise<VscodePromptState> {
		if (!this.props.promptContext.query) {
			return { settings: [], commands: [], query: '' };
		}

		progress?.report(
			new ChatResponseProgressPart(
				l10n.t('Refining question to improve search accuracy.'),
			),
		);
		let userQuery: string = this.props.promptContext.query;

		const endpoint =
			await this.endPointProvider.getChatEndpoint('copilot-fast');
		const renderer = PromptRenderer.create(
			this.instantiationService,
			endpoint,
			VscodeMetaPrompt,
			this.props.promptContext,
		);
		const { messages } = await renderer.render();
		if (token.isCancellationRequested) {
			return { settings: [], commands: [], query: userQuery };
		}

		this.logService.debug(
			'[VSCode Prompt] Asking the model to update the user question.',
		);

		const fetchResult = await endpoint.makeChatRequest(
			'vscodePrompt',
			messages,
			async (_) => void 0,
			token,
			ChatLocation.Panel,
			undefined,
			{
				temperature: 0,
			},
		);

		if (token.isCancellationRequested) {
			return { settings: [], commands: [], query: userQuery };
		}

		let fetchReleaseNotes = false;
		let shouldIncludeDocsSearch = false;
		let extensionSearch = false;
		let vscodeApiSearch = false;
		if (fetchResult.type === ChatFetchResponseType.Success) {
			userQuery = parseMetaPromptResponse(
				this.props.promptContext.query,
				fetchResult.value,
			);
			shouldIncludeDocsSearch =
				fetchResult.value.includes('Other Question');
			fetchReleaseNotes = fetchResult.value.includes('release_notes');
			extensionSearch = fetchResult.value.includes('vscode_extensions');
			vscodeApiSearch = fetchResult.value.includes('vscode_api');
		} else {
			this.logService.error(
				`[VSCode Prompt] Failed to refine the question: ${fetchResult.requestId}`,
			);
		}

		const currentSanitized = sanitizeVSCodeVersion(
			this.envService.getEditorInfo().version,
		); // major.minor
		if (fetchReleaseNotes) {
			// Determine which versions to fetch based on meta response
			const rnMatch =
				fetchResult.type === ChatFetchResponseType.Success
					? fetchResult.value.match(
						/release_notes(?:@(?<spec>[A-Za-z0-9._-]+))?/i,
					)
					: undefined;
			const spec = rnMatch?.groups?.['spec']?.toLowerCase();

			let versionsToFetch: string[];
			if (spec === 'last3') {
				versionsToFetch = getLastNMinorVersions(currentSanitized, 3);
			} else {
				versionsToFetch = [currentSanitized];
			}

			const notes = await Promise.all(
				versionsToFetch.map(async (ver) => {
					const text =
						await this.releaseNotesService.fetchReleaseNotesForVersion(
							ver,
						);
					return text ? { version: ver, notes: text } : undefined;
				}),
			);

			const filtered = notes.filter(
				(n): n is { version: string; notes: string } => !!n,
			);
			return {
				settings: [],
				commands: [],
				releaseNotes: filtered,
				query: this.props.promptContext.query,
				currentVersion: currentSanitized,
			};
		}

		if (extensionSearch || vscodeApiSearch) {
			return {
				settings: [],
				commands: [],
				query: this.props.promptContext.query,
			};
		}

		if (token.isCancellationRequested) {
			return { settings: [], commands: [], query: userQuery };
		}

		const embeddingResult = await this.embeddingsComputer.computeEmbeddings(
			EmbeddingType.text3small_512,
			[userQuery],
			{},
			undefined,
		);
		if (token.isCancellationRequested) {
			return { settings: [], commands: [], query: userQuery };
		}

		const nClosestValuesPromise = progress
			? reportProgressOnSlowPromise(
				progress,
				new ChatResponseProgressPart(
					l10n.t('Searching command and setting index....'),
				),
				this.combinedEmbeddingIndex.nClosestValues(
					embeddingResult.values[0],
					shouldIncludeDocsSearch ? 5 : 25,
				),
				500,
			)
			: this.combinedEmbeddingIndex.nClosestValues(
				embeddingResult.values[0],
				shouldIncludeDocsSearch ? 5 : 25,
			);

		const results = await Promise.allSettled([nClosestValuesPromise]);

		const embeddingResults =
			results[0].status === 'fulfilled'
				? results[0].value
				: { commands: [], settings: [] };

		return {
			settings: embeddingResults.settings,
			commands: embeddingResults.commands,
			query: userQuery,
			currentVersion: currentSanitized,
		};
	}

	override render(state: VscodePromptState) {
		const operatingSystem = this.envService.OS;
		return (
			<>
				<SystemMessage priority={1000}>
					You are a Visual Studio Code assistant. Your job is to<br />
					assist users in using Visual Studio Code by providing<br />
					knowledge to accomplish their task. This knowledge should<br />
					focus on settings, commands, keybindings but also includes<br />
					documentation. <br />
					{state.query.length < 1 && (
						<>
							If the user does not include a question, respond<br />
							with: I am your Visual Studio Code assistant. I can<br />
							help you with settings, commands, keybindings,<br />
							extensions, and documentation. Ask me anything about<br />
							using or configuring Visual Studio Code.<br />
							<br />
						</>
					)}
					<CopilotIdentityRules />
					<SafetyRules />
					<InstructionMessage>
						Additional Rules
						<br />
						If a command or setting references another command or<br />
						setting, you must respond with both the original and the<br />
						referenced commands or settings.<br />
						<br />
						Prefer a setting over a command if the user's request<br />
						can be achieved by a setting change.<br />
						<br />
						If answering with a keybinding, please still include the<br />
						command bound to the keybinding.<br />
						<br />
						If a keybinding contains a backtick you must escape it.<br />
						For example the keybinding Ctrl + backtick would be<br />
						written as ``ctrl + ` ``<br />
						<br />
						If you believe the context given to you is incorrect or<br />
						not relevant you may ignore it.<br />
						<br />
						Always respond with a numbered list of steps to be taken<br />
						to achieve the desired outcome if multiple steps are<br />
						necessary.<br />
						<br />
						If an extension might help the user, you may suggest a<br />
						search query for the extension marketplace. You must<br />
						also include the command **Search marketplace**<br />
						(`workbench.extensions.search`) with args set to the<br />
						suggested query in the commands section at the end of<br />
						your response. The query can also contain the tags<br />
						"@popular", "@recommended", or "@featured" to filter the<br />
						results.<br />
						<br />
						The user is working on a {operatingSystem} machine.<br />
						Please respond with system specific commands if<br />
						applicable.<br />
						<br />
						If a command or setting is not a valid answer, but it<br />
						still relates to Visual Studio Code, please still<br />
						respond.<br />
						<br />
						If the question is about release notes, you must also<br />
						include the command **Show release notes**<br />
						(`update.showCurrentReleaseNotes`) in the commands<br />
						section at the end of your response.<br />
						<br />
						If the response includes a command, only reference the<br />
						command description in the description. Do not include<br />
						the actual command in the description.<br />
						<br />
						All responses for settings and commands code blocks must<br />
						strictly adhere to the template shown below:<br />
						<br />
						<Tag name="responseTemplate">
							<UnsafeCodeBlock
								code={`
{
	"type": "array",
	"items": {
	"type": "object",
	"properties": {
	  "type": {
		"type": "string",
		"enum": ["command", "setting"]
	  },
	  "details": {
		"type": "object",
		"properties": {
		  "key": { "type": "string" },
		  "value": { "type": "string" }
		},
		"required": ["key"]
	  }
	},
	"required": ["type", "details"],
	"additionalProperties": false
	}
}
								`}
								languageId="json"
							></UnsafeCodeBlock>
							<br />
							where the `type` is either `setting`, `command`.
							<br />
							- `setting` is used for responding with a setting to<br />
							set.<br />
							<br />
							- `command` is used for responding with a command to<br />
							execute<br />
							<br />
							where the `details` is an optional object that<br />
							contains the setting/command objects.<br />
							<br />
							- `key` is the setting | command value to use .
							<br />
							- `value` is the setting value in case of a setting.
							<br />
							- `value` is the optional arguments to the command<br />
							in case of a command.<br />
							<br />
						</Tag>
						<Tag name="examples">
							Below you will find a set of examples of what you<br />
							should respond with. Please follow these examples as<br />
							closely as possible.<br />
							<br />
							<Tag name="singleSettingExample">
								Question: How do I disable telemetry?
								<br />
								Response:
								<br />
								Use the **telemetry.telemetryLevel** setting to<br />
								disable telemetry.<br />
								<br />
								<UnsafeCodeBlock
									code={`
[
	{
		"type": "setting",
		"details": {
			"key": "telemetry.telemetryLevel",
			"value": "off"
		}
	}
]
										`}
									languageId="json"
								></UnsafeCodeBlock>
							</Tag>
							<Tag name="singleCommandExample">
								Question: How do I open a specific walkthrough?
								<br />
								Use the **Welcome: Open Walkthrough...** command<br />
								to open walkthroughs.<br />
								<br />
								Response:
								<br />
								<UnsafeCodeBlock
									code={`
[
	{
		"type": "command",
		"details": {
			"key": "workbench.action.openWalkthrough",
		}
	}
]
										`}
									languageId="json"
								></UnsafeCodeBlock>
							</Tag>
							<Tag name="multipleSettingsExample">
								If you are referencing multiple settings, first<br />
								describe each setting and then include all<br />
								settings in a single JSON markdown code block,<br />
								as shown in the template below:<br />
								<br />
								Question: How can I change the font size in all<br />
								areas of Visual Studio Code, including the<br />
								editor, terminal?<br />
								<br />
								Response:
								<br />
								The **editor.fontsize** setting adjusts the font<br />
								size within the editor.<br />
								<br />
								The **terminal.integrated.fontSize** setting<br />
								changes the font size in the integrated<br />
								terminal.<br />
								<br />
								This **window.zoomLevel** setting controls the<br />
								zoom level of the entire Visual Studio Code<br />
								interface.<br />
								<br />
								<UnsafeCodeBlock
									code={`
[
	{
		"type": "setting",
		"details": {
			"key": "editor.fontSize",
			"value": "18"
		}
	},
	{
		"type": "setting",
		"details": {
			"key": "terminal.integrated.fontSize",
			"value": "14"
		}
	},
	{
		"type": "setting",
		"details": {
			"key": "window.zoomLevel",
			"value": "1"
		}
	}
]
										`}
									languageId="json"
								></UnsafeCodeBlock>
							</Tag>
							<Tag name="multipleCommandsExample">
								If you are referencing multiple commands, do not<br />
								combine all the commands into the same JSON<br />
								markdown code block.<br />
								<br />
								Instead, describe each command and include the<br />
								JSON markdown code block in a numbered list, as<br />
								shown in the template below:<br />
								<br />
								Question: How can I setup a python virtual<br />
								environment in Visual Studio Code?<br />
								<br />
								Response:
								<br />
								Use the **Python: Create Environment** command<br />
								to create a new python environment.<br />
								<br />
								<UnsafeCodeBlock
									code={`
[
	{
		"type": "command",
		"details": {
			"key": "python.createEnvironment"
		}
	}
]
									`}
									languageId="json"
								></UnsafeCodeBlock>
								Select the environment type (Venv or Conda) from<br />
								the list.<br />
								<br />
								If creating a Venv environment, select the<br />
								interpreter to use as a base for the new virtual<br />
								environment.<br />
								<br />
								Wait for the environment creation process to<br />
								complete. A notification will show the progress.<br />
								<br />
								Ensure your new environment is selected by using<br />
								the **Python: Select Interpreter** command.<br />
								<br />
								<UnsafeCodeBlock
									code={`
[
	{
		"type": "command",
		"details": {
			"key": "python.setInterpreter"
		}
	}
]
									`}
									languageId="json"
								></UnsafeCodeBlock>
							</Tag>
							<Tag name="noSuchCommandExample">
								Question: How do I move the terminal to a new<br />
								window?<br />
								<br />
								Response:
								<br />
								There is no such command.
								<br />
							</Tag>
							<Tag name="invalidQuestionExample">
								Question: How do I bake a potato?
								<br />
								Response:
								<br />
								Sorry this question isn't related to Visual<br />
								Studio Code.<br />
								<br />
							</Tag>
							<Tag name="marketplaceSearchExample">
								Question: How do I add PHP support?
								<br />
								Response:
								<br />
								You can use the **Search marketplace** command<br />
								to search for extensions that add PHP support.<br />
								<br />
								<UnsafeCodeBlock
									code={`
[
	{
		"type": "command",
		"details": {
			"key": "workbench.extensions.search",
			"value": "php"
		}
	}
]
										`}
									languageId="json"
								></UnsafeCodeBlock>
								<br />
							</Tag>
						</Tag>
						<Tag name="extensionSearchResponseRules">
							If you referene any extensions, you must respond<br />
							with with the identifiers as a comma seperated<br />
							string inside ```vscode-extensions code block.{' '}
							<br />
							Do not describe the extension. Simply return the<br />
							response in the format shown above.<br />
							<br />
							<Tag name="extensionResponseExample">
								Question: What are some popular python<br />
								extensions?<br />
								<br />
								Response:
								<br />
								Here are some popular python extensions.
								<br />
								<UnsafeCodeBlock
									code={`
ms-python.python,ms-python.vscode-pylance
								`}
									languageId="vscode-extensions"
								></UnsafeCodeBlock>
							</Tag>
						</Tag>
						<ResponseTranslationRules />
					</InstructionMessage>
				</SystemMessage>
				<ConversationHistoryWithTools
					flexGrow={1}
					priority={700}
					promptContext={this.props.promptContext}
				/>
				<UserMessage flexGrow={1} priority={800}>
					Use the examples above to help you formulate your response<br />
					and follow the examples as closely as possible. Below is a<br />
					list of information we found which might be relevant to the<br />
					question. For view related commands "Toggle" often means<br />
					Show or Hide. A setting may reference another setting, that<br />
					will appear as \`#setting.id#\`, you must return the<br />
					referenced setting as well. You may use this context to help<br />
					you formulate your response, but are not required to.<br />
					<br />
					{state.commands.length > 0 && (
						<>
							<Tag name="command">
								Here are some possible commands:
								<br />
								{state.commands.map((c) => (
									<TextChunk>
										- {c.label} ("{c.key}") (Keybinding: "
										{c.keybinding}")
									</TextChunk>
								))}
							</Tag>
						</>
					)}
					{state.settings.length > 0 && (
						<>
							<Tag name="settings">
								Here are some possible settings:
								<br />
								{state.settings.map((c) => (
									<TextChunk>
										{settingItemToContext(c)}
									</TextChunk>
								))}
							</Tag>
						</>
					)}
					{state.currentVersion && (
						<>
							<Tag name="currentVSCodeVersion">
								Current VS Code version (major.minor):{' '}
								{state.currentVersion}
							</Tag>
							<br />
						</>
					)}
					{state.releaseNotes && state.releaseNotes.length > 0 && (
						<>
							<Tag name="releaseNotes">
								Below are release notes which might be relevant
								to the question. <br />
								{state.releaseNotes.map((rn) => (
									<>
										<TextChunk>
											Version {rn.version}:
										</TextChunk>
										<br />
										<TextChunk>{rn.notes}</TextChunk>
									</>
								))}
							</Tag>
						</>
					)}
					<Tag name="vscodeAPIToolUseInstructions">
						Always call the tool {ToolName.VSCodeAPI} to get<br />
						documented references and examples when before<br />
						responding to questions about VS Code Extension<br />
						Development.<br />
						<br />
					</Tag>
					<Tag name="searchExtensionToolUseInstructions">
						Always call the tool 'vscode_searchExtensions_internal'<br />
						to first search for extensions in the VS Code<br />
						Marketplace before responding about extensions.<br />
						<br />
					</Tag>
					<Tag name="vscodeCmdToolUseInstructions">
						Call the tool {ToolName.RunVscodeCmd} to run commands in<br />
						Visual Studio Code, only use as part of a new workspace<br />
						creation process. <br />
						You must use the command name as the `name` field and<br />
						the command ID as the `commandId` field in the tool call<br />
						input with any arguments for the command in a `map`<br />
						array.<br />
						<br />
						For example, to run the command<br />
						`workbench.action.openWith`, you would use the following<br />
						input:<br />
						<br />
						<UnsafeCodeBlock
							code={`{
						"name": "workbench.action.openWith",
						"commandId": "workbench.action.openWith",
						"args": ["file:///path/to/file.txt", "default"]
					}
					`}
						></UnsafeCodeBlock>
					</Tag>
				</UserMessage>
				<ChatToolReferences
					priority={850}
					flexGrow={2}
					promptContext={{
						...this.props.promptContext,
						query: state.query,
					}}
					embeddedInsideUserMessage={false}
				/>
				<ChatToolCalls
					priority={899}
					flexGrow={2}
					promptContext={this.props.promptContext}
					toolCallRounds={this.props.promptContext.toolCallRounds}
					toolCallResults={this.props.promptContext.toolCallResults}
				/>
				<ChatVariablesAndQuery
					flexGrow={2}
					priority={900}
					chatVariables={this.props.promptContext.chatVariables}
					query={this.props.promptContext.query}
					embeddedInsideUserMessage={false}
				/>
			</>
		);
	}
}

interface VscodeMetaPromptProps extends BasePromptElementProps {
	history?: readonly Turn[];
	query: string;
}

class VscodeMetaPrompt extends PromptElement<VscodeMetaPromptProps> {
	override render(
		state: void,
		sizing: PromptSizing,
	): PromptPiece<any, any> | undefined {
		return (
			<>
				<SystemMessage priority={1000}>
					You are a Visual Studio Code assistant who helps the user<br />
					create well-formed and unambiguous queries about their<br />
					Visual Studio Code development environment.<br />
					<br />
					Specifically, you help users rewrite questions about how to<br />
					use Visual Studio Code's Commands and Settings.<br />
				</SystemMessage>
				<HistoryWithInstructions
					historyPriority={500}
					passPriority
					history={this.props.history || []}
				>
					<InstructionMessage priority={1000}>
						Evaluate the question to determine the user's intent.{' '}
						<br />
						Determine if the user's question is about the editor,<br />
						terminal, activity bar, side bar, status bar, panel or<br />
						other parts of Visual Studio Code's workbench and<br />
						include those keyword in the rewrite.<br />
						<br />
						Determine if the user is asking about Visual Studio<br />
						Code's Commands and/or Settings and explicitly include<br />
						those keywords during the rewrite. <br />
						If the question does not clearly indicate whether it<br />
						pertains to a command or setting, categorize it as an<br />
						‘Other Question’ <br />
						If the user is asking about Visual Studio Code Release<br />
						Notes, respond using this exact protocol and do not<br />
						rephrase the question: <br />
						- Respond with only one of the following:<br />
						`release_notes@latest` or `release_notes@last3`.<br />
						<br />
						- If the user does not specify a timeframe, respond<br />
						with: `release_notes@latest`.<br />
						<br />
						- If the request is vague about a timeframe (e.g.,<br />
						"recent changes"), respond with: `release_notes@last3`<br />
						to consider the last three versions (major.minor).<br />
						<br />
						- If the user asks to find or locate a specific<br />
						change/feature in the release notes, respond with:<br />
						`release_notes@last3` to search across the last three<br />
						versions (major.minor).<br />
						<br />
						If the user is asking about Extensions available in<br />
						Visual Studio Code, simply respond with<br />
						"vscode_extensions"<br />
						<br />
						If the user is asking about Visual Studio Code API or<br />
						Visual Studio Code Extension Development, simply respond<br />
						with "vscode_api"<br />
						<br />
						Remove any references to "What" or "How" and instead<br />
						rewrite the question as a description of the command or<br />
						setting that the user is trying to find. <br />
						Respond in Markdown. Under a `# Question` header, output<br />
						a rephrased version of the user's question that resolves<br />
						all pronouns and ambiguous words like 'this' to the<br />
						specific nouns they stand for.<br />
						<br />
						If it is not clear what the user is asking for or if the<br />
						question appears to be unrelated to Visual Studio Code,<br />
						do not try to rephrase the question and simply return<br />
						the original question. <br />
						DO NOT ask the user for additional information or<br />
						clarification.<br />
						<br />
						DO NOT answer the user's question directly.
						<br />
						<br />
						# Additional Rules
						<br />
						<br />
						2. If the question contains pronouns such as 'it' or<br />
						'that', try to understand what the pronoun refers to by<br />
						looking at the rest of the question and the conversation<br />
						history.<br />
						<br />
						3. If the question contains an ambiguous word such as<br />
						'this', try to understand what 'this' refers to by<br />
						looking at the rest of the question and the conversation<br />
						history.<br />
						<br />
						4. After a `# Question` header, output a precise version<br />
						of the question that resolves all pronouns and ambiguous<br />
						words like 'this' to the specific nouns they stand for.<br />
						Be sure to preserve the exact meaning of the question.<br />
						<br />
						<br />
						Examples
						<br />
						<br />
						User: opne cmmand palete
						<br />
						<br />
						Assistant:
						<br />
						# Question
						<br />
						Command to open command palette
						<br />
						<br />
						<br />
						User: How do I change change font size in the editor?
						<br />
						<br />
						Assistant:
						<br />
						# Question
						<br />
						Command or setting to change the font size in the editor
						<br />
						<br />
						User: What is the setting to move editor and pin it
						<br />
						Assistant: <br />
						# Question
						<br />
						Settings to move and pin editor
						<br />
						<br />
						User: latest released features
						<br />
						<br />
						Assistant:
						<br />
						release_notes@latest
						<br />
						<br />
						User: What are the recent changes?
						<br />
						<br />
						Assistant:
						<br />
						release_notes@last3
						<br />
						<br />
						User: set up python
						<br />
						<br />
						Assistant:
						<br />
						# Other Question
						<br />
						Set up python development in Visual Studio Code
						<br />
						<br />
						User: Show me popular extensions
						<br />
						<br />
						Assistant:
						<br />
						vscode_extensions
						<br />
						<br />
						User: How do I contribute a command to my extension?
						<br />
						<br />
						Assistant:
						<br />
						vscode_api
						<br />
						<br />
						<ResponseTranslationRules />
					</InstructionMessage>
				</HistoryWithInstructions>
				<UserMessage priority={700}>{this.props.query}</UserMessage>
			</>
		);
	}
}

function parseMetaPromptResponse(
	originalQuestion: string,
	response: string,
): string {
	const match = response.match(
		/#+\s*(Question|Other Question)\n(?<question>.+)/is,
	);
	if (!match?.groups) {
		return originalQuestion.trim();
	}
	return match.groups['question'].trim();
}

function getLastNMinorVersions(current: string, n: number): string[] {
	const m = /^(\d+)\.(\d+)$/.exec(current);
	if (!m) {
		return [current];
	}
	const major = parseInt(m[1], 10);
	let minor = parseInt(m[2], 10);
	const out: string[] = [];
	for (let i = 0; i < n && minor >= 0; i++, minor--) {
		out.push(`${major}.${minor}`);
	}
	return out;
}

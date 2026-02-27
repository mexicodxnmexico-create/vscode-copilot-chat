/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	PromptElement,
	PromptSizing,
	SystemMessage,
	UserMessage,
} from '@vscode/prompt-tsx';
import { ChatLocation } from '../../../../platform/chat/common/commonTypes';
import {
	ConfigKey,
	IConfigurationService,
} from '../../../../platform/configuration/common/configurationService';
import { IEnvService } from '../../../../platform/env/common/envService';
import { IExperimentationService } from '../../../../platform/telemetry/common/nullExperimentationService';
import { GenericBasePromptElementProps } from '../../../context/node/resolvers/genericPanelIntentInvocation';
import { ToolName } from '../../../tools/common/toolNames';
import { Capabilities } from '../base/capabilities';
import { CopilotIdentityRules } from '../base/copilotIdentity';
import { InstructionMessage } from '../base/instructionMessage';
import { ResponseTranslationRules } from '../base/responseTranslationRules';
import { SafetyRules } from '../base/safetyRules';
import { Tag } from '../base/tag';
import { ChatToolReferences, ChatVariablesAndQuery } from './chatVariables';
import { CodeBlockFormattingRules } from './codeBlockFormattingRules';
import { HistoryWithInstructions } from './conversationHistory';
import { CustomInstructions } from './customInstructions';
import { ProjectLabels } from './projectLabels';
import { WorkspaceFoldersHint } from './workspace/workspaceFoldersHint';

export interface PanelChatBasePromptProps extends GenericBasePromptElementProps {}

export class PanelChatBasePrompt extends PromptElement<PanelChatBasePromptProps> {
	constructor(
		props: PanelChatBasePromptProps,
		@IEnvService private readonly envService: IEnvService,
		@IExperimentationService
		private readonly experimentationService: IExperimentationService,
		@IConfigurationService
		private readonly _configurationService: IConfigurationService,
	) {
		super(props);
	}

	async render(state: void, sizing: PromptSizing) {
		const { query, history, chatVariables } = this.props.promptContext;
		const useProjectLabels =
			this._configurationService.getExperimentBasedConfig(
				ConfigKey.Advanced.ProjectLabelsChat,
				this.experimentationService,
			);
		const operatingSystem = this.envService.OS;

		return (
			<>
				<SystemMessage priority={1000}>
					You are an AI programming assistant.
					<br />
					<CopilotIdentityRules />
					<SafetyRules />
					<Capabilities location={ChatLocation.Panel} />
					<WorkspaceFoldersHint flexGrow={1} priority={800} />
					{/* Only include current date when not running simulations, since if we generate cache entries with the current date, the cache will be invalidated every day */}
					{!this.envService.isSimulation() && (
						<>
							<br />
							The current date is{' '}
							{new Date().toLocaleDateString(undefined, {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
							})}
							.
						</>
					)}
				</SystemMessage>
				<HistoryWithInstructions
					flexGrow={1}
					historyPriority={700}
					passPriority
					history={history}
					currentTurnVars={chatVariables}
				>
					<InstructionMessage priority={1000}>
						Use Markdown formatting in your answers.
						<br />
						<CodeBlockFormattingRules />
						For code blocks use four backticks to start and end.
						<br />
						Avoid wrapping the whole response in triple backticks.
						<br />
						The user works in an IDE called Visual Studio Code which<br />
						has a concept for editors with open files, integrated<br />
						unit test support, an output pane that shows the output<br />
						of running the code as well as an integrated terminal.<br />
						<br />
						The user is working on a {operatingSystem} machine.<br />
						Please respond with system specific commands if<br />
						applicable.<br />
						<br />
						The active document is the source code the user is<br />
						looking at right now.<br />
						<br />
						You can only give one reply for each conversation turn.
						<br />
						<ResponseTranslationRules />
						<br />
						{this.props.promptContext.tools?.toolReferences.find(
							(tool) => tool.name === ToolName.Codebase,
						) ? (
								<Tag name="codebaseToolInstructions">
								1. Consider how to answer the user's prompt<br />
								based on the provided information. Always assume<br />
								that the user is asking about the code in their<br />
								workspace instead of asking a general<br />
								programming question. Prefer using variables,<br />
								functions, types, and classes from the workspace<br />
								over those from the standard library.<br />
									<br />
								2. Generate a response that clearly and<br />
								accurately answers the user's question. In your<br />
								response, add fully qualified links for<br />
								referenced symbols (example:<br />
								[`namespace.VariableName`](path/to/file.ts)) and<br />
								links for files (example:<br />
								[path/to/file](path/to/file.ts)) so that the<br />
								user can open them. If you do not have enough<br />
								information to answer the question, respond with<br />
								"I'm sorry, I can't answer that question with<br />
								what I currently know about your workspace".<br />
								</Tag>
							) : undefined}
					</InstructionMessage>
				</HistoryWithInstructions>
				<UserMessage flexGrow={2}>
					{useProjectLabels && (
						<ProjectLabels flexGrow={1} priority={600} />
					)}
					<CustomInstructions
						flexGrow={1}
						priority={750}
						languageId={undefined}
						chatVariables={chatVariables}
					/>
					<ChatToolReferences
						priority={899}
						flexGrow={2}
						promptContext={this.props.promptContext}
					/>
					<ChatVariablesAndQuery
						flexGrow={3}
						flexReserve="/3"
						priority={900}
						chatVariables={chatVariables}
						query={query}
						includeFilepath={true}
					/>
				</UserMessage>
			</>
		);
	}
}

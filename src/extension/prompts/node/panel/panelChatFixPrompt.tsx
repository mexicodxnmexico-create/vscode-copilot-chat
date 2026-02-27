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
import { ILanguageDiagnosticsService } from '../../../../platform/languages/common/languageDiagnosticsService';
import { findDiagnosticForSelectionAndPrompt } from '../../../context/node/resolvers/fixSelection';
import { GenericBasePromptElementProps } from '../../../context/node/resolvers/genericPanelIntentInvocation';
import { IDocumentContext } from '../../../prompt/node/documentContext';
import { Capabilities } from '../base/capabilities';
import { InstructionMessage } from '../base/instructionMessage';
import { ResponseTranslationRules } from '../base/responseTranslationRules';
import { SafetyRules } from '../base/safetyRules';
import { Diagnostics } from '../inline/diagnosticsContext';
import { ChatToolReferences, ChatVariablesAndQuery } from './chatVariables';
import { CodeBlockFormattingRules } from './codeBlockFormattingRules';
import { HistoryWithInstructions } from './conversationHistory';
import { CustomInstructions } from './customInstructions';
import { ChatToolCalls } from './toolCalling';

export interface PanelChatFixPromptProps extends GenericBasePromptElementProps {}

export class PanelChatFixPrompt extends PromptElement<PanelChatFixPromptProps> {
	constructor(
		props: PanelChatFixPromptProps,
		@ILanguageDiagnosticsService
		private readonly languageDiagnosticsService: ILanguageDiagnosticsService,
	) {
		super(props);
	}

	render(state: void, sizing: PromptSizing) {
		const documentContext = this.props.documentContext;
		const { history, chatVariables } = this.props.promptContext;
		const query =
			this.props.promptContext.query ||
			'There is a problem in this code. Rewrite the code to show it with the bug fixed.';
		const getDiagnostics = ({ document, selection }: IDocumentContext) =>
			findDiagnosticForSelectionAndPrompt(
				this.languageDiagnosticsService,
				document.uri,
				selection,
				query,
			);
		return (
			<>
				<SystemMessage priority={1000}>
					You are an AI programming assistant.
					<br />
					When asked for your name, you must respond with "GitHub<br />
					Copilot".<br />
					<br />
					Follow the user's requirements carefully & to the letter.
					<br />
					<SafetyRules />
					<br />
					<br />
					<Capabilities location={ChatLocation.Panel} />
				</SystemMessage>
				<HistoryWithInstructions
					flexGrow={1}
					passPriority
					historyPriority={700}
					history={history}
				>
					<InstructionMessage priority={1000}>
						First think step-by-step - describe your plan for what<br />
						to build in pseudocode, written out in great detail.<br />
						<br />
						Then output the code in a single code block.
						<br />
						Minimize any other prose.
						<br />
						Use Markdown formatting in your answers.
						<br />
						<CodeBlockFormattingRules />
						The user works in an IDE called Visual Studio Code which<br />
						has a concept for editors with open files, integrated<br />
						unit test support, an output pane that shows the output<br />
						of running the code as well as an integrated terminal.<br />
						<br />
						The active document is the source code the user is<br />
						looking at right now.<br />
						<br />
						You can only give one reply for each conversation turn.
						<br />
						<br />
						Additional Rules
						<br />
						You specialize in being a highly skilled code generator.<br />
						Your task is to help the Developer fix an issue.<br />
						<br />
						If context is provided, try to match the style of the<br />
						provided code as best as possible.<br />
						<br />
						Generated code is readable and properly indented.
						<br />
						Markdown blocks are used to denote code.
						<br />
						Preserve user's code comment blocks, do not exclude them<br />
						when refactoring code.<br />
						<br />
						Pay especially close attention to the selection or<br />
						exception context.<br />
						<br />
						Given a description of what to do you can refactor, fix<br />
						or enhance the existing code.<br />
						<ResponseTranslationRules />
					</InstructionMessage>
				</HistoryWithInstructions>
				<UserMessage flexGrow={1} priority={750}>
					<CustomInstructions
						languageId={documentContext?.language.languageId}
						chatVariables={chatVariables}
					/>
				</UserMessage>
				{documentContext && (
					<UserMessage flexGrow={1} priority={800}>
						<Diagnostics
							documentContext={documentContext}
							diagnostics={getDiagnostics(documentContext)}
						/>
					</UserMessage>
				)}
				{/* todo@connor4312/roblou: is this the right thing to do here? */}
				{
					<ChatToolCalls
						priority={899}
						flexGrow={2}
						promptContext={this.props.promptContext}
						toolCallRounds={this.props.promptContext.toolCallRounds}
						toolCallResults={
							this.props.promptContext.toolCallResults
						}
					/>
				}
				{
					<ChatToolReferences
						priority={899}
						flexGrow={2}
						promptContext={this.props.promptContext}
						embeddedInsideUserMessage={false}
					/>
				}
				<ChatVariablesAndQuery
					flexGrow={2}
					priority={900}
					chatVariables={chatVariables}
					query={query}
					embeddedInsideUserMessage={false}
				/>
			</>
		);
	}
}

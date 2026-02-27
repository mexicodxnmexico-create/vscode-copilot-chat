/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PromptElement, PromptSizing } from '@vscode/prompt-tsx';
import { IWorkspaceChunkSearchService } from '../../../../platform/workspaceChunkSearch/node/workspaceChunkSearchService';
import { GenericBasePromptElementProps } from '../../../context/node/resolvers/genericPanelIntentInvocation';
import { ToolName } from '../../../tools/common/toolNames';
import { CopilotToolMode } from '../../../tools/common/toolsRegistry';
import { InstructionMessage } from '../base/instructionMessage';
import { IPromptEndpoint } from '../base/promptRenderer';
import { Tag } from '../base/tag';
import { ChatVariablesAndQuery } from './chatVariables';
import { HistoryWithInstructions } from './conversationHistory';
import { ChatToolCalls } from './toolCalling';
import { MAX_CHUNKS_RESULTS } from './workspace/workspaceContext';
import { WorkspaceFoldersHint } from './workspace/workspaceFoldersHint';
import { MultirootWorkspaceStructure } from './workspace/workspaceStructure';

export class CodebaseAgentPrompt extends PromptElement<GenericBasePromptElementProps> {
	constructor(
		props: GenericBasePromptElementProps,
		@IWorkspaceChunkSearchService
		private readonly workspaceChunkSearch: IWorkspaceChunkSearchService,
		@IPromptEndpoint private readonly promptEndpoint: IPromptEndpoint,
	) {
		super(props);
	}

	async render(state: void, sizing: PromptSizing) {
		const {
			query,
			chatVariables,
			history,
			toolCallRounds,
			toolCallResults,
		} = this.props.promptContext;
		const isCodesearchFast = await this.workspaceChunkSearch.hasFastSearch({
			endpoint: this.promptEndpoint,
			tokenBudget: sizing.tokenBudget,
			fullWorkspaceTokenBudget: sizing.tokenBudget,
			maxResultCountHint: MAX_CHUNKS_RESULTS,
		});
		return (
			<>
				<HistoryWithInstructions
					flexGrow={1}
					passPriority
					historyPriority={700}
					history={history}
				>
					<InstructionMessage>
						<Tag name="context">
							<WorkspaceFoldersHint />
							<MultirootWorkspaceStructure
								maxSize={2000}
								excludeDotFiles={true}
							/>
							<br />
							This view of the workspace structure may be<br />
							truncated. You can use tools to collect more context<br />
							if needed.<br />
						</Tag>
						<Tag name="instructions">
							You are a code search expert.
							<br />
							A developer needs to find some code in their<br />
							codebase so that they can resolve a question or<br />
							complete a task. You have full access to their<br />
							codebase and can run tools to find code in it. Their<br />
							request may contain hints for some of the files<br />
							needed. It may require just one tool or many tools<br />
							to collect the full context required.<br />
							<br />
							First, analyze the developer's request to determine<br />
							how complicated their task is. Keep your search<br />
							focused on the developer's request, and don't run<br />
							extra tools if the developer's request clearly can<br />
							be satisfied by just one.<br />
							<br />
							If the developer wants to implement a feature and<br />
							they have not specified the relevant files, first<br />
							break down the developer's request into smaller<br />
							concepts and think about the kinds of files you need<br />
							to grasp each concept.<br />
							<br />
							If you cannot infer the project type (languages,<br />
							frameworks, and libraries) from the developer's<br />
							request or the context that you have, run the `<br />
							{ToolName.ReadProjectStructure}` tool to get the lay<br />
							of the land and read additional files to understand<br />
							the project setup.<br />
							<br />
							If you aren't sure which tool is relevant, you can<br />
							call multiple tools. You can call tools repeatedly<br />
							to take actions or gather as much context as needed.<br />
							<br />
							Don't make assumptions about the situation. Gather<br />
							enough context to address the developer's request<br />
							without going overboard.<br />
							<br />
							Your only task is to help the developer find<br />
							context. Do not write code for the developer's<br />
							request.<br />
							<br />
							Your response will be read by your colleague who is<br />
							an expert in editing files, not the developer, so do<br />
							not offer to edit files or perform additional follow<br />
							up actions at the end of your response.<br />
						</Tag>
						<Tag name="toolUseInstructions">
							Remember that you can call multiple tools in one<br />
							response.<br />
							<br />
							If you think running multiple tools can answer the<br />
							user's question, prefer calling them in parallel<br />
							whenever possible, but do not call `<br />
							{ToolName.Codebase}` in parallel.
							<br />
							Use `{ToolName.Codebase}` to search for high level<br />
							concepts or descriptions of functionality in the<br />
							user's question.<br />
							{!isCodesearchFast &&
								` Note that '${ToolName.Codebase}' is slow, so you should only run it if you are confident its results will be relevant.`}
							<br />
							Prefer `{ToolName.SearchWorkspaceSymbols}` over `
							{ToolName.FindTextInFiles}` when you have precise<br />
							code identifiers to search for.<br />
							<br />
							Prefer `{ToolName.FindTextInFiles}` over `
							{ToolName.Codebase}` when you have precise keywords<br />
							to search for.<br />
							<br />
							When using a tool, follow the JSON schema very<br />
							carefully and make sure to include all required<br />
							fields.<br />
							<br />
							If a tool exists to do a task, use the tool instead<br />
							of asking the developer to manually take an action.<br />
							<br />
							If you say that you will take an action, then go<br />
							ahead and use the tool to do it.<br />
							<br />
							The tools `{ToolName.FindFiles}`, `
							{ToolName.FindTextInFiles}`, and `
							{ToolName.GetScmChanges}` are deterministic and<br />
							comprehensive, so do not repeatedly invoke them with<br />
							the same arguments.<br />
							<br />
							If the tool `{ToolName.Codebase}` returns the full<br />
							contents of the text files in the workspace, you<br />
							have all the workspace context.<br />
							<br />
							Never use multi_tool_use.parallel or any tool that<br />
							does not exist. Use tools using the proper<br />
							procedure. DO NOT write out a JSON codeblock with<br />
							the tool inputs.<br />
						</Tag>
					</InstructionMessage>
				</HistoryWithInstructions>
				<ChatToolCalls
					priority={899}
					flexGrow={3}
					promptContext={this.props.promptContext}
					toolCallRounds={toolCallRounds}
					toolCallResults={toolCallResults}
					toolCallMode={CopilotToolMode.FullContext}
				/>
				<ChatVariablesAndQuery
					flexGrow={2}
					priority={900}
					chatVariables={chatVariables}
					query={`The developer's request is: ${query}\n\nFind all code in the workspace relevant to the following request.`}
					includeFilepath={true}
					embeddedInsideUserMessage={false}
				/>
			</>
		);
	}
}

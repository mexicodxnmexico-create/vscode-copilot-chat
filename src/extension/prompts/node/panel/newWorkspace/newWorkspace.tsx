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
	RenderPromptResult,
	SystemMessage,
	UserMessage,
} from '@vscode/prompt-tsx';
import type * as vscode from 'vscode';
import {
	ChatFetchResponseType,
	ChatLocation,
} from '../../../../../platform/chat/common/commonTypes';
import {
	EmbeddingType,
	IEmbeddingsComputer,
} from '../../../../../platform/embeddings/common/embeddingsComputer';
import { IEndpointProvider } from '../../../../../platform/endpoint/common/endpointProvider';
import {
	GithubRepositoryItem,
	IGithubRepositoryService,
} from '../../../../../platform/github/common/githubService';
import { IChatEndpoint } from '../../../../../platform/networking/common/networking';
import { IProjectTemplatesIndex } from '../../../../../platform/projectTemplatesIndex/common/projectTemplatesIndex';
import { reportProgressOnSlowPromise } from '../../../../../util/common/progress';
import { CancellationToken } from '../../../../../util/vs/base/common/cancellation';
import * as path from '../../../../../util/vs/base/common/path';
import { IInstantiationService } from '../../../../../util/vs/platform/instantiation/common/instantiation';
import { ChatResponseProgressPart } from '../../../../../vscodeTypes';
import { newId } from '../../../../intents/node/newIntent';
import { PromptMetadata } from '../../../../prompt/common/conversation';
import { IBuildPromptContext } from '../../../../prompt/common/intents';
import { CopilotIdentityRules } from '../../base/copilotIdentity';
import { InstructionMessage } from '../../base/instructionMessage';
import { PromptRenderer } from '../../base/promptRenderer';
import { ResponseTranslationRules } from '../../base/responseTranslationRules';
import { SafetyRules } from '../../base/safetyRules';
import { ChatToolReferences, ChatVariablesAndQuery } from '../chatVariables';
import {
	ConversationHistory,
	HistoryWithInstructions,
} from '../conversationHistory';
import { CustomInstructions } from '../customInstructions';
import { EditorIntegrationRules } from '../editorIntegrationRules';
import { UnsafeCodeBlock } from '../unsafeElements';

export interface NewWorkspacePromptProps extends BasePromptElementProps {
	promptContext: IBuildPromptContext;
	useTemplates: boolean;
	endpoint: IChatEndpoint;
}

export interface NewWorkspacePromptState {
	intent?: Instruction;
	url?: string;
}

type Instruction = {
	intent: string;
	question: string;
};

function parseInstruction(input: string): Instruction {
	const lines = input.split('\n');
	const instruction: Partial<Instruction> = {};
	lines.forEach((line, index) => {
		if (line.startsWith('# Intent')) {
			instruction.intent = lines[index + 1]?.trim();
		} else if (line.startsWith('# Question')) {
			instruction.question = lines[index + 1]?.trim();
		}
	});
	return instruction as Instruction;
}

export class NewWorkspacePrompt extends PromptElement<
	NewWorkspacePromptProps,
	NewWorkspacePromptState
> {
	private _metadata: NewWorkspaceGithubContentMetadata | undefined;

	constructor(
		props: NewWorkspacePromptProps,
		@IInstantiationService
		private readonly instantiationService: IInstantiationService,
		@IEmbeddingsComputer
		private readonly embeddingsComputer: IEmbeddingsComputer,
		@IEndpointProvider private readonly endPointProvider: IEndpointProvider,
		@IProjectTemplatesIndex
		private readonly projectTemplatesIndex: IProjectTemplatesIndex,
		@IGithubRepositoryService
		private readonly repositoryService: IGithubRepositoryService,
	) {
		super(props);
	}

	override async prepare(
		sizing: PromptSizing,
		progress:
			| vscode.Progress<
					| vscode.ChatResponseProgressPart
					| vscode.ChatResponseReferencePart
			  >
			| undefined,
		token: CancellationToken,
	): Promise<NewWorkspacePromptState> {
		if (!progress) {
			throw new Error('Progress is required');
		}

		progress?.report(
			new ChatResponseProgressPart(l10n.t('Determining user intent...')),
		);
		const endpoint =
			await this.endPointProvider.getChatEndpoint('copilot-fast');
		const { messages } = await buildNewWorkspaceMetaPrompt(
			this.instantiationService,
			endpoint,
			this.props.promptContext,
		);

		if (token.isCancellationRequested) {
			return {};
		}

		const fetchResult = await endpoint.makeChatRequest(
			'newWorkspace',
			messages,
			undefined,
			token,
			ChatLocation.Panel,
			undefined,
			{
				temperature: 0,
			},
		);

		if (fetchResult.type === ChatFetchResponseType.Success) {
			const instruction = parseInstruction(fetchResult.value);
			if (instruction.intent === 'File') {
				return { intent: instruction };
			} else if (instruction.intent === 'Project') {
				if (this.props.useTemplates) {
					const result =
						await this.embeddingsComputer.computeEmbeddings(
							EmbeddingType.text3small_512,
							[instruction.question],
							{},
							undefined,
						);
					progress.report(
						new ChatResponseProgressPart(
							l10n.t('Searching project template index...'),
						),
					);
					const similarProjects =
						await this.projectTemplatesIndex.nClosestValues(
							result.values[0],
							1,
						);
					if (similarProjects.length > 0) {
						const content = similarProjects[0]?.split(':');
						const org = content[0].trim();
						const repo = content[1].trim();
						const repoPath =
							content[2].trim() === '' ? '.' : content[2].trim();

						if (org && repo && repoPath) {
							const items = await reportProgressOnSlowPromise(
								progress,
								new ChatResponseProgressPart(
									l10n.t('Fetching project contents...'),
								),
								this.repositoryService.getRepositoryItems(
									org,
									repo,
									repoPath,
								),
								500,
							);
							if (items.length > 0) {
								let url: string;
								if (repoPath === '.') {
									url = `httpx://github.com/${org}/${repo}`;
								} else {
									url = path.dirname(items[0].html_url);
								}

								this._metadata =
									new NewWorkspaceGithubContentMetadata(
										org,
										repo,
										repoPath,
										items,
									);
								return { url: url };
							}
						}
					}
				}
				return { intent: instruction };
			} else {
				// revert to default behavior
				return {
					intent: {
						intent: 'Project',
						question: this.props.promptContext.query,
					},
				};
			}
		} else {
			throw new Error(
				l10n.t(
					'Encountered an error while determining user intent: ({0}) {1}',
					fetchResult.type,
					fetchResult.reason,
				),
			);
		}
	}

	override render(
		state: NewWorkspacePromptState,
	): PromptPiece<any, any> | undefined {
		const { query, history, chatVariables } = this.props.promptContext;
		return (
			<>
				<SystemMessage priority={1000}>
					<CopilotIdentityRules />
					<SafetyRules />
				</SystemMessage>
				<ConversationHistory
					priority={600}
					history={history.filter(
						(turn) =>
							turn.responseMessage?.name === newId &&
							turn.request.type === 'user',
					)}
				/>
				{state.intent?.intent === 'File' && (
					<>
						<InstructionMessage priority={1000}>
							You are a Visual Studio Code assistant. Your job is<br />
							to generate the contents of a new file based on the<br />
							user's query.<br />
							<br />
							If a code snippet or markdown is provided, consider<br />
							it as part of the file content creation process.<br />
							<br />
							The code should not contain bugs and should adhere<br />
							to best practices.<br />
							<br />
							Your response should be just two code blocks - the<br />
							first one with the file contents and the second JSON<br />
							code block with a file name.<br />
							<br />
							Your response should not contain any other<br />
							information or explanation.<br />
							<br />
							# Response Template
							<br />
							<UnsafeCodeBlock
								code={`
    def greet(name):
      print(f"Hello, {name}!")
    greet("John Doe")
  `}
								languageId="python"
							></UnsafeCodeBlock>
							<UnsafeCodeBlock
								code={`
    'fileName': 'suggestedFileName',
`}
								languageId="json"
							></UnsafeCodeBlock>
							<br />
							Examples:
							<br />
							User: Generate the contents of the new file based on<br />
							this query:<br />
							<br />
							python hello world file
							<br />
							Assistant:
							<br />
							<UnsafeCodeBlock
								code={`
    def greet(name):
      print(f"Hello, {name}!")

    greet("John Doe")
  `}
								languageId="python"
							></UnsafeCodeBlock>
							<UnsafeCodeBlock
								code={`
    {
    'fileName': 'sampleHelloWorld.py',
    }
`}
								languageId="json"
							></UnsafeCodeBlock>
							<ResponseTranslationRules />
						</InstructionMessage>
						<ChatToolReferences
							priority={899}
							flexGrow={2}
							promptContext={this.props.promptContext}
							embeddedInsideUserMessage={false}
						/>
						<ChatVariablesAndQuery
							priority={900}
							chatVariables={chatVariables}
							query={state.intent.question}
							embeddedInsideUserMessage={false}
						/>
					</>
				)}
				{state.intent?.intent === 'Project' && !this._metadata && (
					<>
						<InstructionMessage priority={1000}>
							You are a VS Code assistant. Your job is to suggest<br />
							a filetree directory structure for a project that a<br />
							user wants to create.<br />
							<br />
							If a step does not relate to filetree directory<br />
							structures, do not respond. Please do not guess a<br />
							response and instead just respond with a polite<br />
							apology if you are unsure. ## Additional Rules ##<br />
							<br />
							If the user does not specify "app" or "project" in<br />
							their query, assume they are asking for a project.<br />
							<br />
							You should always start your response to the user<br />
							with "Sure, here's a proposed directory structure<br />
							for a [project type] app:"<br />
							<br />
							You should generate a markdown file tree structure<br />
							for the sample project and include it in your<br />
							response if you are proposing a sample.<br />
							<br />
							You should only list common files for the user's<br />
							desired project type if you are proposing a sample.<br />
							<br />
							You should always include a README.md file which<br />
							describes the project if you are proposing a sample.<br />
							<br />
							Do not include folders and files generated after<br />
							compiling, building or running the project such as<br />
							node_modules, dist, build, out.<br />
							<br />
							Do not include image files such as png, jpg, ico,<br />
							etc.<br />
							<br />
							Do not include any descriptions or explanations in<br />
							your response other than what is shown in the<br />
							response templates.<br />
							<br />
							If the user asks for a file content to be modified,<br />
							respond with the same file tree structure and ask<br />
							them to open the file to view the modifications.<br />
							<br />
							Do not attempt to modify the file content your self<br />
							and simply respond with the same file tree<br />
							structure.<br />
							<br />
							<EditorIntegrationRules />
							<ResponseTranslationRules />
							<br />
							Additional Rules
							<br />
							## Response template ##
							<br />
							Sure, here's a proposed directory structure for a<br />
							[project type] app:<br />
							<br />
							\`\`\`filetree
							<br />
							[project-name]
							<br />
							├── src
							<br />
							│ ├── app.ts
							<br />
							│ └── types
							<br />
							│ └── index.ts
							<br />
							├── package.json
							<br />
							├── tsconfig.json
							<br />
							└── README.md
							<br />
							\`\`\`
							<br />
							{[
								'',
								'Examples for response templates above. Please follow these examples as closely as possible.',
								'',
								'## Valid setup question',
								'',
								'User: Create a TypeScript express app',
								'Assistant:',
								'',
								"Sure, here's a proposed directory structure for a TypeScript Express app:",
								'',
								'\`\`\`filetree',
								'my-express-app',
								'├── src',
								'│   ├── app.ts',
								'│   ├── controllers',
								'│   │   └── index.ts',
								'│   ├── routes',
								'│   │   └── index.ts',
								'│   └── types',
								'│       └── index.ts',
								'├── package.json',
								'├── tsconfig.json',
								'└── README.md',
								'\`\`\`',
								'',
								'## Invalid setup question',
								'',
								'User: Create a horse project',
								"Assistant: Sorry, I don't know how to set up a horse project.",
							].join('\n')}
							<ResponseTranslationRules />
						</InstructionMessage>
						<UserMessage priority={750}>
							<CustomInstructions
								languageId={undefined}
								chatVariables={chatVariables}
							/>
						</UserMessage>
						<ChatToolReferences
							priority={899}
							flexGrow={2}
							promptContext={this.props.promptContext}
							embeddedInsideUserMessage={false}
						/>
						<ChatVariablesAndQuery
							priority={900}
							chatVariables={chatVariables}
							query={state.intent.question}
							embeddedInsideUserMessage={false}
						/>
					</>
				)}
				{!state.intent && this._metadata && (
					<>
						<InstructionMessage priority={1000}>
							You are a Visual Studio Code assistant. The user has<br />
							identified a project URL for a new project they want<br />
							to create. They will provide a URL for the project,<br />
							and your job is to simply confirm the user's choice<br />
							if the URL is relevant.<br />
							<br />
							If the URL is not relevant, you should ignore the<br />
							URL and simply suggest a file tree directory<br />
							structure for a project that the user wants to<br />
							create. Do not attempt to clarify the URL to the<br />
							user.<br />
							<br />
							Please do not guess a response and instead just<br />
							respond with a polite apology if you are unsure.<br />
							<br />
							<EditorIntegrationRules />
							<ResponseTranslationRules />
							<br />
							Additional Rules
							<br />
							## Response template when the user has provided a<br />
							project URL but it is irrelevant. Notice how the<br />
							response ignores the provided URL entirely and does<br />
							not attempt to clarify this to the user. ##<br />
							<br />
							Sure, here's a proposed directory structure for a<br />
							[project type] app:<br />
							<br />
							\`\`\`filetree
							<br />
							[project-name]
							<br />
							├── src
							<br />
							│ ├── app.ts
							<br />
							│ └── types
							<br />
							│ └── index.ts
							<br />
							├── package.json
							<br />
							├── tsconfig.json
							<br />
							└── README.md
							<br />
							\`\`\`
							<br />
							{[
								'',
								'Examples for response templates above. Please follow these examples as closely as possible.',
								'',
								'## Valid setup question with an irrelevant URL ##',
								'',
								'User: Create a TypeScript express app',
								'URL: https://github.com/microsoft/vscode-extension-samples/tree/main/getting-started-sample',
								'Assistant:',
								'',
								"Sure, here's a proposed directory structure for a TypeScript Express app:",
								'',
								'\`\`\`filetree',
								'my-express-app',
								'├── src',
								'│   ├── app.ts',
								'│   ├── controllers',
								'│   │   └── index.ts',
								'│   ├── routes',
								'│   │   └── index.ts',
								'│   └── types',
								'│       └── index.ts',
								'├── package.json',
								'├── tsconfig.json',
								'└── README.md',
								'\`\`\`',
								'',
								'## Invalid setup question ##',
								'',
								'User: Create a horse project',
								"Assistant: Sorry, I don't know how to set up a horse project.",
							].join('\n')}
							## Response template when the user has provided a<br />
							project URL that is relevant ##<br />
							<br />
							# USING_URL <br />
							Sure, here's a GitHub sample project to help you get<br />
							started on [project type]: [Project Type<br />
							Sample](url)<br />
							<br />
							{[
								'',
								'Examples for response template with a relevant URL described above. Please follow this example as closely as possible.',
								'',
								'## Valid setup question with a relevant project URL. Notice how you should not propose a file directory structure in this case. ##',
								'',
								'User: Create a VSCode extension sample for contributing getting started walkthrough.',
								'URL: https://github.com/microsoft/vscode-extension-samples/tree/main/getting-started-sample',
								'Assistant:',
								'',
								'# USING_URL',
								"Sure, here's a GitHub sample project to help you get started on creating a VSCode extension with a walkthrough contribution: [Walkthrough Sample](https://github.com/microsoft/vscode-extension-samples/tree/main/getting-started-sample)",
								'',
							].join('\n')}
							<br />
							## Additional Rules for Project Tree generation ##
							<br />
							You should only generate a file tree structure if<br />
							the URL procvided by the user is not relevant.<br />
							<br />
							You should generate a markdown file tree structure<br />
							for the sample project and include it in your<br />
							response if you are proposing a sample.<br />
							<br />
							You should only list common files for the user's<br />
							desired project type if you are proposing a sample.<br />
							<br />
							You should always include a README.md file which<br />
							describes the project if you are proposing a sample.<br />
							<br />
							Do not include folders and files generated after<br />
							compiling, building, or running the project such as<br />
							node_modules, dist, build, out.<br />
							<br />
							Do not include image files such as png, jpg, ico,<br />
							etc.<br />
							<br />
							Do not include any descriptions or explanations in<br />
							your response other than what is shown in the<br />
							response templates.<br />
							<br />
							If the user asks for a file content to be modified,<br />
							respond with the same file tree structure and ask<br />
							them to open the file to view the modifications.<br />
							<br />
							Do not attempt to modify the file content yourself<br />
							and simply respond with the same file tree<br />
							structure.<br />
							<br />
							<ResponseTranslationRules />
						</InstructionMessage>
						<UserMessage priority={750}>
							<CustomInstructions
								languageId={undefined}
								chatVariables={chatVariables}
							/>
						</UserMessage>
						<UserMessage priority={900}>
							{state.url && (
								<>
									Below is the URL you should consider for<br />
									your response.<br />
									<br />
									URL: {state.url}
									<br />
								</>
							)}
						</UserMessage>
						<ChatToolReferences
							priority={899}
							flexGrow={2}
							promptContext={this.props.promptContext}
							embeddedInsideUserMessage={false}
						/>
						<ChatVariablesAndQuery
							priority={900}
							chatVariables={chatVariables}
							query={query}
							embeddedInsideUserMessage={false}
						/>
						{this._metadata && (
							<>
								<meta value={this._metadata} />
							</>
						)}
					</>
				)}
			</>
		);
	}
}

export class NewWorkspaceGithubContentMetadata extends PromptMetadata {
	constructor(
		public readonly org: string,
		public readonly repo: string,
		public readonly path: string,
		public readonly githubRepoItems: GithubRepositoryItem[],
	) {
		super();
	}
}

export namespace NewWorkspaceGithubContentMetadata {
	export function is(obj: any): obj is NewWorkspaceGithubContentMetadata {
		return obj instanceof NewWorkspaceGithubContentMetadata;
	}
}

export interface NewWorkspaceMetaPromptProps extends BasePromptElementProps {
	promptContext: IBuildPromptContext;
	endpoint: IChatEndpoint;
}

async function buildNewWorkspaceMetaPrompt(
	instantiationService: IInstantiationService,
	endpoint: IChatEndpoint,
	promptContext: IBuildPromptContext,
): Promise<RenderPromptResult> {
	const renderer = PromptRenderer.create(
		instantiationService,
		endpoint,
		NewWorkspaceMetaPrompt,
		{
			promptContext,
			endpoint,
		},
	);

	return renderer.render();
}

export class NewWorkspaceMetaPrompt extends PromptElement<
	NewWorkspaceMetaPromptProps,
	void
> {
	override render(
		state: void,
		sizing: PromptSizing,
	): PromptPiece<any, any> | undefined {
		const { query, history, chatVariables } = this.props.promptContext;

		return (
			<>
				<SystemMessage priority={1000}>
					You are a Visual Studio Code assistant focused on aiding<br />
					users in crafting clear and specific specifications about<br />
					project or file creation within Visual Studio Code. Your<br />
					role involves:<br />
					<br />
					- Helping users articulate their intent about creating<br />
					projects for various platforms and programming languages.<br />
					<br />
					- Assessing the user's intent to determine whether it<br />
					pertains to project or file creation.<br />
					<br />
					- Identifying the programming language the user is inquiring<br />
					about, or inferring it based on the platform or project type<br />
					mentioned.<br />
					<br />
					- Rewriting the user's query to eliminate ambiguity and<br />
					ensure clarity.<br />
					<br />
					- Resolving any pronouns and vague terms to their specific<br />
					referents.<br />
					<br />
					- Responding with a rephrased question that accurately<br />
					reflects the user's intent.<br />
					<br />
					- Using the additional context to resolve ambiguities in the<br />
					user's query, such as "it" or "that".<br />
					<br />
				</SystemMessage>
				<HistoryWithInstructions
					historyPriority={500}
					passPriority
					history={history || []}
				>
					<InstructionMessage priority={1000}>
						- If the user does not specify an application logic or<br />
						feature, you should assume that the user is new to<br />
						programming and provide a basic project structure to<br />
						help with a simple Hello World project.<br />
						<br />
						- If the user does not specify "app," "project," or<br />
						"file" in their query, assume they are asking for a<br />
						project. - If it is not clear what the user is asking<br />
						for or if the question appears to be unrelated to Visual<br />
						Studio Code, do not try to rephrase the question and<br />
						simply return the original question.<br />
						<br />
						- DO NOT ask the user for additional information or<br />
						clarification.<br />
						<br />
						- DO NOT answer the user's question directly.
						<br />
						<br />
						Guidelines for rewriting questions:
						<br />
						- Understand the user's intent by carefully reading<br />
						their question.<br />
						<br />
						- Clarify pronouns ('it', 'that') by deducing their<br />
						referents from the question or conversation context.<br />
						<br />
						- Resolve ambiguous terms ('this') to their specific<br />
						meanings based on the question or conversation context.<br />
						<br />
						- Rephrase the question under a `# Question` header,<br />
						ensuring all vague terms are clarified without altering<br />
						the original intent.<br />
						<br />
						<br />
						When responding:
						<br />
						- Use Markdown to format your response, starting with a<br />
						`# Question` header followed by the rephrased question.<br />
						<br />
						- If the user's intent is unclear or unrelated to Visual<br />
						Studio Code, simply return the original question without<br />
						modification.<br />
						<br />
						- If the user has not explicitly mentioned that they are<br />
						looking for a project or a file, assume that they are<br />
						asking for a Visual Studio project.<br />
						<br />
						- Avoid requesting additional information or directly<br />
						answering the question.<br />
						<br />
						- Use the template below to report the identified<br />
						intent, rephrased question, and any application logic or<br />
						feature that may be relevant.<br />
						<br />
						<br />
						# Response Template
						<br />
						# Intent
						<br />
						Project|File
						<br />
						# Question
						<br />
						Rephrased question here.
						<br />
						<br />
						# Examples:
						<br />
						User: Python game.
						<br />
						Assistant:
						<br />
						# Intent
						<br />
						Project
						<br />
						# Question
						<br />
						Create a new Python sample game project.
						<br />
						<br />
						User: Node.js server
						<br />
						Assistant:
						<br />
						# Intent
						<br />
						Project
						<br />
						# Question
						<br />
						Create a new Node.js development environment.
						<br />
						<br />
						User: TS web app
						<br />
						Assistant:
						<br />
						# Intent
						<br />
						Project
						<br />
						# Question
						<br />
						Create a new TypeScript project with a basic "Hello<br />
						World" web application.<br />
						<br />
						<br />
						User: VS Code extension custom sidebar
						<br />
						Assistant:
						<br />
						# Intent
						<br />
						Project
						<br />
						# Question
						<br />
						Create a Visual Studio Code extension sample that adds a<br />
						custom sidebar.<br />
						<br />
						<br />
						<ResponseTranslationRules />
					</InstructionMessage>
				</HistoryWithInstructions>

				<UserMessage flexGrow={1} priority={750}>
					<CustomInstructions
						languageId={undefined}
						chatVariables={chatVariables}
					/>
				</UserMessage>
				<ChatToolReferences
					priority={899}
					flexGrow={2}
					promptContext={this.props.promptContext}
					embeddedInsideUserMessage={false}
				/>
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

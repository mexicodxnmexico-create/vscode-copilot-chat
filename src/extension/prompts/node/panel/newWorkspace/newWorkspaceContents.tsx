/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	AssistantMessage,
	BasePromptElementProps,
	PromptElement,
	PromptPiece,
	PromptSizing,
	Raw,
	SystemMessage,
	UserMessage,
} from '@vscode/prompt-tsx';
import { getTextPart } from '../../../../../platform/chat/common/globalStringUtils';
import { CopilotIdentityRules } from '../../base/copilotIdentity';
import { ResponseTranslationRules } from '../../base/responseTranslationRules';
import { SafetyRules } from '../../base/safetyRules';

export interface NewWorkspaceContentsPromptProps extends BasePromptElementProps {
	query: string;
	fileTreeStr: string;
	history?: Raw.ChatMessage[];
	filePath?: string;
	projectSpecification?: string;
	relavantFiles?: Map<string, string>;
}

export class FileContentsPrompt extends PromptElement<NewWorkspaceContentsPromptProps> {
	override render(): PromptPiece<any, any> | undefined {
		return (
			<>
				{this.props.history && (
					<NewWorkspaceConversationHistory
						messages={this.props.history}
					/>
				)}
				<SystemMessage priority={1000}>
					You are a VS Code assistant. Your job is to generate the<br />
					contents of a file in a project when given the user<br />
					description, specification and tree structure of the project<br />
					that a user wants to create. <br />
					<br />
					Additional Rules
					<br />
					Think step by step and give me contents for just the file<br />
					requested by the user. The code should not contain bugs.<br />
					<br />
					If the user has asked for modifications to an existing file,<br />
					please use the File path and File contents provided below if<br />
					applicable.<br />
					<br />
					If the file is supposed to be empty, please respond with a<br />
					code comment saying that this file is intentionally left<br />
					blank.<br />
					<br />
					Do not include comments in json files.
					<br />
					Do not use code blocks or backticks.
					<br />
					Do not include product names such as Visual Studio in the<br />
					comments.<br />
					<br />
				</SystemMessage>
				{this.props.relavantFiles &&
					this.props.relavantFiles.size > 0 && (
					<>
						<UserMessage priority={500}>
								Below, you will find a list of file paths and<br />
								their contents previously used<br />
							<br />
							{Array.from(this.props.relavantFiles)
								.map(([key, value]) => {
										return `File path: ${key}\nFile contents: ${value}\n`;
									})
								.join('\n')}
						</UserMessage>
					</>
				)}
				<UserMessage priority={900}>
					Generate the contents of the file: {this.props.filePath}{' '}
					<br />
					This is the project tree structure:
					<br />
					\`\`\`filetree' <br />
					{this.props.fileTreeStr}
					<br />
					\`\`\`
					<br />
					The project should adhere to the following specification:
					<br />
					{this.props.projectSpecification}
					<br />
				</UserMessage>
			</>
		);
	}
}

export class ProjectSpecificationPrompt extends PromptElement<NewWorkspaceContentsPromptProps> {
	override render(): PromptPiece<any, any> | undefined {
		return (
			<>
				{this.props.history && (
					<NewWorkspaceConversationHistory
						messages={this.props.history}
					/>
				)}
				<SystemMessage priority={1000}>
					You are a VS Code assistant. Your job is to generate the<br />
					project specification when given the user description and<br />
					file tree structure of the project that a user wants to<br />
					create. <br />
					<CopilotIdentityRules />
					<SafetyRules />
					<ResponseTranslationRules />
					<br />
					Additional Rules
					<br />
					Think step by step and respond with a text description that<br />
					lists and summarizes each file inside this project.<br />
					<br />
					List the classes, types, interfaces, functions, and<br />
					constants it exports and imports if it is a code file.<br />
					<br />
					Consider filenames and file extensions when determining the<br />
					programming languages used in the project. List any special<br />
					configurations or settings required for configuration files<br />
					such as package.json or tsconfig.json to help compile the<br />
					project successfully<br />
					<br />
					You should be as specific as possible when listing the<br />
					public properties and methods for each exported class.<br />
					<br />
					Do not use code blocks or backticks. Do not include any text<br />
					before or after the file contents.<br />
					<br />
					Do not include comments in json files.
					<br />
					Do not use code blocks or backticks.
					<br />
					Do not include product names such as Visual Studio in the<br />
					comments.<br />
					<br />
					Below you will find a set of examples of what you should<br />
					respond with. Please follow these examples as closely as<br />
					possible.<br />
					<br />
					<br />
					## Valid question
					<br />
					User: I want to set up the following project: Create a<br />
					TypeScript Express app<br />
					<br />
					This is the project tree structure:
					<br />
					\`\`\`markdown <br />
					my-express-app
					<br />
					├── src
					<br />
					│ ├── app.ts
					<br />
					│ ├── controllers
					<br />
					│ │ └── index.ts
					<br />
					│ ├── routes
					<br />
					│ │ └── index.ts
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
					## Valid response
					<br />
					Assistant: The project has the following files:
					<br />
					\`src/app.ts\`: This file is the entry point of the<br />
					application. It creates an instance of the express app and<br />
					sets up middleware and routes.<br />
					<br />
					\`src/controllers/index.ts\`: This file exports a class<br />
					\`IndexController\` which has a method \`getIndex\` that<br />
					handles the root route of the application.<br />
					<br />
					\`src/routes/index.ts\`: This file exports a function<br />
					\`setRoutes\` which sets up the routes for the application.<br />
					It uses the \`IndexController\` to handle the root route.<br />
					<br />
					\`src/types/index.ts\`: This file exports interfaces<br />
					\`Request\` and \`Response\` which extend the interfaces<br />
					from the \`express\` library.<br />
					<br />
					\`tsconfig.json\`: This file is the configuration file for<br />
					TypeScript. It specifies the compiler options and the files<br />
					to include in the compilation.<br />
					<br />
					\`package.json\`: This file is the configuration file for<br />
					npm. It lists the dependencies and scripts for the project.<br />
					<br />
					\`README.md\`: This file contains the documentation for the<br />
					project.<br />
					<br />
				</SystemMessage>
				<UserMessage priority={900}>
					I want to set up the following project: {this.props.query}
					<br />
					This is the project tree structure:
					<br />
					\`\`\`markdown' <br />
					{this.props.fileTreeStr}
					<br />
					\`\`\`
					<br />
				</UserMessage>
			</>
		);
	}
}

interface NewWorkspaceConversationHistoryProps extends BasePromptElementProps {
	messages: Raw.ChatMessage[];
}

class NewWorkspaceConversationHistory extends PromptElement<NewWorkspaceConversationHistoryProps> {
	override render(
		state: void,
		sizing: PromptSizing,
	): PromptPiece<any, any> | undefined {
		const history: (UserMessage | AssistantMessage | SystemMessage)[] = [];

		for (const curr of this.props.messages) {
			switch (curr.role) {
				case Raw.ChatRole.User:
					history.push(
						<UserMessage priority={600}>
							{getTextPart(curr.content)}
						</UserMessage>,
					);
					break;
				case Raw.ChatRole.System:
					history.push(
						<AssistantMessage priority={800}>
							{getTextPart(curr.content)}
						</AssistantMessage>,
					);
					break;
				default:
					break;
			}
		}
		return <>{history}</>;
	}
}

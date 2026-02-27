/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	BasePromptElementProps,
	PromptElement,
	TextChunk,
	UserMessage,
} from '@vscode/prompt-tsx';
import { JsonSchema } from '../../../platform/configuration/common/jsonSchema';
import { GenericBasePromptElementProps } from '../../context/node/resolvers/genericPanelIntentInvocation';
import { InstructionMessage } from '../../prompts/node/base/instructionMessage';
import { Tag } from '../../prompts/node/base/tag';
import { HistoryWithInstructions } from '../../prompts/node/panel/conversationHistory';
import { ChatToolCalls } from '../../prompts/node/panel/toolCalling';
import { CopilotToolMode } from '../../tools/common/toolsRegistry';
import {
	McpPickRef,
	QuickInputTool,
	QuickPickTool,
} from './mcpToolCallingTools';

export interface IMcpToolCallingLoopPromptContext {
	packageName: string;
	packageType: 'npm' | 'pip' | 'docker' | 'nuget';
	packageReadme: string | undefined;
	packageVersion: string | undefined;
	targetSchema: JsonSchema;
	pickRef: McpPickRef;
}

export interface IMcpToolCallingLoopProps
	extends GenericBasePromptElementProps, IMcpToolCallingLoopPromptContext {}

const packageTypePreferredCommands = {
	pip: (name: string, version: string | undefined) =>
		`uvx ${name.replaceAll('-', '_')}` + (version ? `==${version}` : ''),
	npm: (name: string, version: string | undefined) =>
		`npx ${name}` + (version ? `@${version}` : ''),
	docker: (name: string, _version: string | undefined) =>
		`docker run -i --rm ${name}`,
	nuget: (name: string, version: string | undefined) =>
		`dnx ${name}` + (version ? `@${version}` : '') + ` --yes`,
};

export class McpToolCallingLoopPrompt extends PromptElement<IMcpToolCallingLoopProps> {
	async render() {
		const {
			packageType,
			packageName,
			packageVersion,
			pickRef,
			packageReadme,
		} = this.props;
		const {
			history,
			toolCallRounds = [],
			toolCallResults = {},
		} = this.props.promptContext;

		// We do kind of a 'special' thing here to have the tool only available to *this* prompt because
		// we're in a quickpick flow (and don't really want the tool generally available)
		for (const round of toolCallRounds) {
			for (const tool of round.toolCalls) {
				if (toolCallResults[tool.id]) {
					// no-op
				} else if (tool.name === QuickInputTool.ID) {
					toolCallResults[tool.id] = await QuickInputTool.invoke(
						pickRef,
						JSON.parse(tool.arguments),
					);
				} else if (tool.name === QuickPickTool.ID) {
					toolCallResults[tool.id] = await QuickPickTool.invoke(
						pickRef,
						JSON.parse(tool.arguments),
					);
				}
			}
		}

		const hasMcpJson = packageReadme?.includes('"mcpServers":');
		const command = packageTypePreferredCommands[packageType](
			packageName,
			packageVersion,
		);

		return (
			<>
				<HistoryWithInstructions
					flexGrow={1}
					passPriority
					historyPriority={700}
					history={history}
				>
					<InstructionMessage>
						<Tag name="instructions">
							You are an expert in reading documentation and<br />
							extracting relevant results.<br />
							<br />A developer is setting up a Model Context
							Protocol (MCP) server based on a {packageType}{' '}
							package. Your task is to create a configuration for<br />
							the server matching the provided JSON schema.<br />
							<br />
							{hasMcpJson ? (
								<InstructionsWithMcpJson
									command={command}
									packageVersion={packageVersion}
								/>
							) : (
								<InstructionsWithout
									command={command}
									packageVersion={packageVersion}
								/>
							)}
							<br />
							<br />
							When using a tool, follow the JSON schema very<br />
							carefully and make sure to include all required<br />
							fields. DO NOT write out a JSON codeblock with the<br />
							tool inputs.<br />
							<br />
						</Tag>
						<Tag name="example">
							<Tag name="request">
								User: I want to run the npm package<br />
								`@modelcontextprotocol/server-redis` as an MCP<br />
								server. This is its readme:<br />
								<br />
								<br />
								{redisExampleReadme}
							</Tag>
							<Tag name="response">
								{hasMcpJson && (
									<>
										The readme has an example confirmation<br />
										I'll work off of:<br />
										<br />${clauseExampleConfiguration}
									</>
								)}
								<br />
								Based on{' '}
								{hasMcpJson
									? 'this example'
									: 'the documentation'}
								, I need the following information to run the<br />
								MCP server:<br />
								<br />
								- Redis hostname
								<br />
								- Redis port number
								<br />
								- Redis password (optional)
								<br />
								<br />
								I will now ask for this information.
								<br />
								[[`{QuickInputTool.ID}` called requesting Redis<br />
								hostname]]: "redis.example.com"<br />
								<br />
								[[`{QuickInputTool.ID}` called requesting Redis<br />
								port number]]: "3000"<br />
								<br />
								[[`{QuickInputTool.ID}` called requesting Redis<br />
								port password]]: ""<br />
								<br />
								<br />
								{!hasMcpJson && (
									<>
										Based on this data, the command needed<br />
										to run the MCP server is `npx<br />
										@modelcontextprotocol/server-redis<br />
										redis://example.com:6379`<br />
									</>
								)}
								Based on this data, the command needed to run<br />
								the MCP server is `npx<br />
								@modelcontextprotocol/server-redis<br />
								redis://example.com:6379`<br />
								<br />
								<br />
								Here is the JSON object that matches the<br />
								provided schema:<br />
								<br />
								{redisExampleConfig}
							</Tag>
						</Tag>
					</InstructionMessage>
				</HistoryWithInstructions>
				<UserMessage flexGrow={3}>
					I want to run the {packageType} package `{packageName}` as<br />
					an MCP server. This is its readme:<br />
					<br />
					<Tag name="readme">{this.props.packageReadme}</Tag>
					The schema for the final JSON object is:
					<br />
					<Tag name="schema" flexGrow={1}>
						<TextChunk breakOnWhitespace>
							{JSON.stringify(this.props.targetSchema, null, 2)}
						</TextChunk>
					</Tag>
				</UserMessage>
				<ChatToolCalls
					priority={899}
					flexGrow={2}
					promptContext={this.props.promptContext}
					toolCallRounds={toolCallRounds}
					toolCallResults={toolCallResults}
					toolCallMode={CopilotToolMode.FullContext}
				/>
			</>
		);
	}
}

class InstructionsWithMcpJson extends PromptElement<
	{
		command: string;
		packageVersion: string | undefined;
	} & BasePromptElementProps
> {
	render() {
		const [command, ...args] = this.props.command.split(' ');
		return (
			<>
				Think step by step:
				<br />
				1. Read the documentation for the MCP server and find the<br />
				section that discusses setting up a configuration with<br />
				`mcpServers`. If there are multiple such examples, find the one<br />
				that works best when run as `<br />
				{`{"command":"${command}", "args": ["${args.join('", "')}", ...], , "env": { ... } }`}
				. State this configuration in your response.
				<br />
				2. Determine what placeholders are used in that example that the<br />
				user would need to fill, such as configuration options,<br />
				credentials, or API keys.<br />
				<br />
				3. Call the tool `{QuickInputTool.ID}` a maximum of 5 times to<br />
				gather the placeholder information. You may make multiple calls<br />
				using this tool in parallel, but the maximum number of questions<br />
				must be 5.<br />
				<br />
				4. Transform that example configuration entry, replacing or<br />
				adding any additional information the user gave you, into a JSON<br />
				object matching the provided schema.<br />
				<br />
				{this.props.packageVersion && (
					<>
						The package version is {this.props.packageVersion}, make<br />
						sure your command runs the correct version, using the<br />
						form `{this.props.command}`.
						<br />
					</>
				)}
				5. Return the resulting JSON object in a markdown code block<br />
				wrapped with triple backticks (```)<br />
				<br />
			</>
		);
	}
}
class InstructionsWithout extends PromptElement<
	{
		command: string;
		packageVersion: string | undefined;
	} & BasePromptElementProps
> {
	render() {
		return (
			<>
				The MCP server the developer is asking about can be run using
				the command {this.props.command}, but it may need additional<br />
				arguments or environment variables to function.<br />
				<br />
				<br />
				Think step by step:
				<br />
				1. Read the documentation for the MCP server and determine what<br />
				information you would need to run it on the command line.<br />
				<br />
				2. Call the tool `{QuickInputTool.ID}` a maximum of 5 times to<br />
				gather the necessary information. You may make multiple calls<br />
				using this tool in parallel, but the maximum number of questions<br />
				must be 5.<br />
				<br />
				3. Use that information to construct a set of arguments and
				environment variables to run the server. <br />
				{this.props.packageVersion && (
					<>
						The package version is {this.props.packageVersion}, make<br />
						sure your command runs the correct version, using the<br />
						form `{this.props.command}`.
						<br />
					</>
				)}
				4. Translate the command, arguments and environment variables<br />
				into a JSON object that matches the provided schema.<br />
				<br />
				5. Return the resulting JSON object in a markdown code block<br />
				wrapped with triple backticks (```)<br />
				<br />
				<br />
				Follow these rules when constructing your arguments and<br />
				environment variables:<br />
				<br />
				1. Prefer to use environment variables over arguments when<br />
				possible, especially for sensitive information. Command-line<br />
				arguments are not secure.<br />
				<br />
				2. Look carefully in the readme for instructions for how to run<br />
				the MCP server in `stdio` mode. If there are additional<br />
				arguments needed to run the MCP server in `stdio` mode, then you<br />
				MUST include them in your output.<br />
				<br />
				4. Briefly summarize how the above instructions were followed in<br />
				your response.<br />
				<br />
			</>
		);
	}
}

const clauseExampleConfiguration = `\`\`\`json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-redis",
        "redis://localhost:6379"
      ]
    }
  }
}
\`\`\``;

const redisExampleReadme = `<readme>
# Redis

A Model Context Protocol server that provides access to Redis databases. This server enables LLMs to interact with Redis key-value stores through a set of standardized tools.

## Components

### Tools

- **set**
  - Set a Redis key-value pair with optional expiration
  - Input:
    - \`key\` (string): Redis key
    - \`value\` (string): Value to store
    - \`expireSeconds\` (number, optional): Expiration time in seconds

- **get**
  - Get value by key from Redis
  - Input: \`key\` (string): Redis key to retrieve

- **delete**
  - Delete one or more keys from Redis
  - Input: \`key\` (string | string[]): Key or array of keys to delete

- **list**
  - List Redis keys matching a pattern
  - Input: \`pattern\` (string, optional): Pattern to match keys (default: *)

## Usage with Claude Desktop

To use this server with the Claude Desktop app, add the following configuration to the "mcpServers" section of your \`claude_desktop_config.json\`:

### Docker

* when running docker on macos, use host.docker.internal if the server is running on the host network (eg localhost)
* Redis URL can be specified as an argument, defaults to "redis://localhost:6379"

\`\`\`json
{
  "mcpServers": {
    "redis": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "mcp/redis",
        "redis://host.docker.internal:6379"]
    }
  }
}
\`\`\`

### NPX

${clauseExampleConfiguration}
</readme>`;

const redisExampleConfig = `
\`\`\`json
{
	"name": "redis",
	"command": "npx",
	"args": [
		"@modelcontextprotocol/server-redis",
		"redis://redis.example.com:3000"
	]
}
\`\`\`
`;

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { ContextResolver } from '../../chatSessionContext/vscode-node/chatSessionContextProvider';
import { IConversationStore } from '../../conversationStore/node/conversationStore';
import { ILogService } from '../../../platform/log/common/logService';
import { Conversation } from '../../prompt/common/conversation';

// Mock vscode
vi.mock('vscode', () => {
	const LanguageModelChatMessageRole = {
		User: 1,
		Assistant: 2,
		System: 3
	};

	class LanguageModelChatMessage {
		static User(content: string) {
			return new LanguageModelChatMessage(LanguageModelChatMessageRole.User, content);
		}
		static Assistant(content: string) {
			return new LanguageModelChatMessage(LanguageModelChatMessageRole.Assistant, content);
		}

		constructor(public role: number, public content: any) {}
	}

	class LanguageModelTextPart {
		constructor(public value: string) {}
	}

    class Disposable {
        static from(...disposables: any[]) { return new Disposable(); }
        dispose() {}
    }

	return {
		LanguageModelChatMessageRole,
		LanguageModelChatMessage,
		LanguageModelTextPart,
		CancellationTokenSource: class {
			token = {};
		},
		lm: {
			selectChatModels: vi.fn()
		},
        Position: class {},
        Range: class {},
        Selection: class {},
        EventEmitter: class { event = vi.fn(); fire = vi.fn(); dispose = vi.fn(); },
        Uri: { parse: vi.fn(), file: vi.fn() },
        Disposable,
        l10n: { t: (s: string) => s },
        authentication: { getSession: vi.fn() },
        Diagnostic: class {},
        TextEdit: class {},
        WorkspaceEdit: class {},
        MarkdownString: class {},
        TextEditorCursorStyle: {},
        TextEditorLineNumbersStyle: {},
        TextEditorRevealType: {},
        EndOfLine: {},
        DiagnosticSeverity: {},
        ExtensionMode: {},
        Location: class {},
        DiagnosticRelatedInformation: class {},
        ChatVariableLevel: {},
        ChatResponseClearToPreviousToolInvocationReason: {},
        ChatResponseMarkdownPart: class {},
        ChatResponseThinkingProgressPart: class {},
        ChatResponseHookPart: class {},
        ChatHookType: {},
        ChatResponseFileTreePart: class {},
        ChatResponseAnchorPart: class {},
        ChatResponseProgressPart: class {},
        ChatResponseProgressPart2: class {},
        ChatResponseReferencePart: class {},
        ChatResponseReferencePart2: class {},
        ChatResponseCodeCitationPart: class {},
        ChatResponseCommandButtonPart: class {},
        ChatResponseWarningPart: class {},
        ChatResponseMovePart: class {},
        ChatResponseExtensionsPart: class {},
        ChatResponseExternalEditPart: class {},
        ChatResponsePullRequestPart: class {},
        ChatResponseMarkdownWithVulnerabilitiesPart: class {},
        ChatResponseCodeblockUriPart: class {},
        ChatResponseTextEditPart: class {},
        ChatResponseNotebookEditPart: class {},
        ChatResponseWorkspaceEditPart: class {},
        ChatResponseConfirmationPart: class {},
        ChatQuestion: class {},
        ChatQuestionType: {},
        ChatResponseQuestionCarouselPart: class {},
        ChatRequest: class {},
        ChatRequestTurn: class {},
        ChatResponseTurn: class {},
        NewSymbolName: class {},
        NewSymbolNameTag: {},
        NewSymbolNameTriggerKind: {},
        ChatLocation: class {},
        ChatRequestEditorData: class {},
        ChatRequestNotebookData: class {},
        LanguageModelToolInformation: class {},
        LanguageModelToolResult: class {},
        ExtendedLanguageModelToolResult: class {},
        LanguageModelToolResult2: class {},
        SymbolInformation: class {},
        LanguageModelPromptTsxPart: class {},
        LanguageModelTextPart2: class {},
        LanguageModelThinkingPart: class {},
        LanguageModelDataPart: class {},
        LanguageModelDataPart2: class {},
        LanguageModelPartAudience: {},
        LanguageModelToolMCPSource: class {},
        LanguageModelToolExtensionSource: class {},
        ChatReferenceBinaryData: class {},
        ChatReferenceDiagnostic: class {},
        TextSearchMatch2: class {},
        AISearchKeyword: class {},
        ExcludeSettingOptions: {},
        NotebookCellKind: {},
        NotebookRange: class {},
        NotebookEdit: class {},
        NotebookCellData: class {},
        NotebookData: class {},
        ChatErrorLevel: {},
        TerminalShellExecutionCommandLineConfidence: {},
        ChatRequestEditedFileEventKind: {},
        Extension: class {},
        LanguageModelToolCallPart: class {},
        LanguageModelToolResultPart: class {},
        LanguageModelToolResultPart2: class {},
        LanguageModelChatToolMode: {},
        TextEditorSelectionChangeKind: {},
        TextDocumentChangeReason: {},
        ChatToolInvocationPart: class {},
        ChatSubagentToolInvocationData: class {},
        ChatMcpToolInvocationData: class {},
        McpToolInvocationContentData: class {},
        ChatResponseTurn2: class {},
        ChatRequestTurn2: class {},
        LanguageModelError: class {},
        SymbolKind: {},
        SnippetString: class {},
        SnippetTextEdit: class {},
        FileType: {},
        ChatSessionStatus: {},
        McpHttpServerDefinition: class {},
        McpStdioServerDefinition: class {},
        ThemeIcon: class {}
	};
});

describe('ContextResolver Security Fix', () => {
	let logService: ILogService;
	let conversationStore: IConversationStore;
	let sendRequestMock: any;

	beforeEach(() => {
		logService = {
			trace: vi.fn(),
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			getLevel: vi.fn(),
			setLevel: vi.fn(),
			onDidChangeLogLevel: vi.fn(),
			dispose: vi.fn()
		} as unknown as ILogService;

		conversationStore = {
			lastConversation: undefined,
			onDidUpdateConversation: vi.fn(),
			getConversation: vi.fn()
		} as unknown as IConversationStore;

		sendRequestMock = vi.fn().mockResolvedValue({
			stream: (async function* () {
				yield new vscode.LanguageModelTextPart('Summary');
			})()
		});

		(vscode.lm.selectChatModels as any).mockResolvedValue([{
			sendRequest: sendRequestMock
		}]);
	});

	it('should use System role for system prompt and User role for conversation content', async () => {
		const conversation: Conversation = {
			sessionId: '1',
			turns: [
				{
					startTime: Date.now(),
					request: { message: 'Hello' },
					responseMessage: { message: 'Hi there' }
				}
			]
		} as any;

		conversationStore.lastConversation = conversation;

		const resolver = new ContextResolver(
			logService,
			conversationStore,
			() => undefined,
			() => undefined,
			() => {}
		);

		await resolver.resolve({} as any, {} as any);

		expect(sendRequestMock).toHaveBeenCalled();
		const messages = sendRequestMock.mock.calls[0][0];

		// We expect 2 messages: 1 System, 1 User
		expect(messages.length).toBe(2);
		expect(messages[0].role).toBe(vscode.LanguageModelChatMessageRole.System);
		expect(messages[0].content).toContain('You are a helpful assistant');

		expect(messages[1].role).toBe(vscode.LanguageModelChatMessageRole.User);
		expect(messages[1].content).toContain('Conversation:');
		expect(messages[1].content).toContain('<conversation>');
		expect(messages[1].content).toContain('</conversation>');
        expect(messages[1].content).not.toContain('You are a helpful assistant');
	});
});

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	AssistantMessage,
	BasePromptElementProps,
	Chunk,
	PrioritizedList,
	PromptElement,
	PromptReference,
	PromptSizing,
	SystemMessage,
	UserMessage,
} from '@vscode/prompt-tsx';

import { NotebookDocumentSnapshot } from '../../../../platform/editing/common/notebookDocumentSnapshot';
import { TextDocumentSnapshot } from '../../../../platform/editing/common/textDocumentSnapshot';
import { IIgnoreService } from '../../../../platform/ignore/common/ignoreService';
import { IParserService } from '../../../../platform/parser/node/parserService';
import { getLanguageForResource } from '../../../../util/common/languages';
import { CharCode } from '../../../../util/vs/base/common/charCode';
import { StringEdit } from '../../../../util/vs/editor/common/core/edits/stringEdit';
import { IInstantiationService } from '../../../../util/vs/platform/instantiation/common/instantiation';
import { Uri } from '../../../../vscodeTypes';
import { getStructure } from '../../../context/node/resolvers/selectionContextHelpers';
import { CompositeElement } from '../base/common';
import { ResponseTranslationRules } from '../base/responseTranslationRules';
import { LegacySafetyRules } from '../base/safetyRules';
import { Tag } from '../base/tag';
import { ProjectedDocument } from '../inline/summarizedDocument/summarizeDocument';
import {
	DocumentSummarizer,
	NotebookDocumentSummarizer,
	summarizeDocumentSync,
} from '../inline/summarizedDocument/summarizeDocumentHelpers';
import { EXISTING_CODE_MARKER } from '../panel/codeBlockFormattingRules';
import { fileVariableCostFn } from '../panel/fileVariable';
import { CodeBlock } from '../panel/safeElements';
import { UnsafeCodeBlock } from '../panel/unsafeElements';
import { ICodeMapperRequestInput, isNewDocument } from './codeMapper';
import {
	PatchEditExamplePatch,
	PatchEditInputCodeBlock,
	PatchEditRules,
} from './patchEditGeneration';

export interface CodeMapperPromptProps extends BasePromptElementProps {
	readonly request: ICodeMapperRequestInput;
	readonly shouldTrimCodeBlocks?: boolean;
	readonly inProgressRewriteContent?: string;
}

export class CodeMapperPatchRewritePrompt extends PromptElement<CodeMapperPromptProps> {
	constructor(
		props: CodeMapperPromptProps,
		@IIgnoreService private readonly ignoreService: IIgnoreService,
		@IParserService private readonly parserService: IParserService,
	) {
		super(props);
	}

	async render(state: void, sizing: PromptSizing) {
		if (isNewDocument(this.props.request)) {
			// TODO@joyceerhl @aeschli remove the find/replace variant
			return;
		}

		const document = this.props.request.existingDocument;

		const isIgnored = await this.ignoreService.isCopilotIgnored(
			document.uri,
		);
		if (isIgnored) {
			return <ignoredFiles value={[document.uri]} />;
		}

		const inputDocCharLimit =
			(sizing.endpoint.modelMaxPromptTokens / 3) * 4; // consume one 3rd of the model window, estimating roughly 4 chars per token;
		let projectedDocument: ProjectedDocument;
		if (
			document.getText().length > inputDocCharLimit &&
			document instanceof TextDocumentSnapshot
		) {
			// TODO@rebornix @DonJayamanne handle large notebook document
			// only compute the summarized document if needed
			const structure = await getStructure(
				this.parserService,
				document,
				undefined,
			);
			projectedDocument = summarizeDocumentSync(
				inputDocCharLimit,
				document,
				undefined,
				structure,
				{ tryPreserveTypeChecking: false },
			);
		} else {
			projectedDocument = new ProjectedDocument(
				document.getText(),
				StringEdit.empty,
				document.languageId,
			);
		}
		const exampleUri = Uri.file('/someFolder/myFile.ts');
		return (
			<>
				<references value={[new PromptReference(document.uri)]} />
				<SystemMessage priority={1000}>
					You are an AI programming assistant that is specialized in<br />
					applying code changes to an existing document.<br />
					<br />I have a code block that represents a suggestion for a
					code change and I have a {document.languageId} file opened<br />
					in a code editor.<br />
					<br />
					I expect you to come up with code changes that apply the<br />
					code block to the editor.<br />
					<br />
					I want the changes to be applied in a way that is safe and<br />
					does not break the existing code, is correctly indented and<br />
					matching the code style.<br />
					<br />
					For the response, always follow these instructions:
					<br />
					1. Analyse the code block, the content of the editor and the<br />
					current selection to decide if the code block should replace<br />
					existing code or is to be inserted.<br />
					<br />
					2. A line comment with `{EXISTING_CODE_MARKER}` indicates a<br />
					section of code that has not changed<br />
					<br />
					3. If necessary, break up the code block in multiple parts<br />
					and insert each part at the appropriate location.<br />
					<br />
					4. If necessary, make changes to other parts in the editor<br />
					so that the final result is valid, properly formatted and<br />
					indented.<br />
					<br />
					5. Finally, provide the code modifications
					<br />
					<PatchEditRules />
					<br />
					<LegacySafetyRules />
					<ResponseTranslationRules />
					<Tag name="example" priority={100}>
						<Tag name="user">
							I have the following code open in the editor.
							<br />
							<PatchEditInputCodeBlock
								uri={exampleUri}
								languageId="typescript"
								code={[
									`import { readFileSync } from 'fs';`,
									'',
									'class C { }',
								]}
							/>
							<br />
							This is the code block that represents a suggestion<br />
							for a code change:<br />
							<br />
							<UnsafeCodeBlock
								code={'private _stream: Stream;'}
								languageId={'typescript'}
								includeFilepath={false}
							/>
							<br />
							Please find out how the code block can be applied to<br />
							the editor.<br />
						</Tag>
						<Tag name="assistant">
							<PatchEditExamplePatch
								changes={[
									{
										uri: exampleUri,
										find: [
											`import { readFileSync } from 'fs';`,
										],
										replace: [
											`import { readFileSync } from 'fs';`,
											`import { Stream } from 'stream';`,
										],
									},
									{
										uri: exampleUri,
										find: ['class C { }'],
										replace: [
											'class C {',
											'\tprivate _stream: Stream;',
											'}',
										],
									},
								]}
							/>
						</Tag>
					</Tag>
				</SystemMessage>
				<UserMessage priority={700}>
					<CompositeElement /*priority={600} TODO@aeschli commented out for fixed prompt-tsx issue */
					>
						{projectedDocument.text.length > 0 ? (
							<>
								I have the following code open in the editor,
								starting from line 1 to line{' '}
								{projectedDocument.lineCount}.<br />
							</>
						) : (
							<>
								I am in an empty file:
								<br />
							</>
						)}
						<PatchEditInputCodeBlock
							uri={document.uri}
							languageId={document.languageId}
							code={projectedDocument.text}
							shouldTrim={false}
						/>
						<br />
					</CompositeElement>
					<CodeBlockChangeDescription
						markdownBeforeBlock={getLastSentence(
							this.props.request.markdownBeforeBlock,
						)}
					/>
					This is the code block that represents a suggestion for a<br />
					code change:<br />
					<br />
					<CodeBlock
						uri={document.uri}
						languageId={document.languageId}
						code={this.props.request.codeBlock}
						shouldTrim={false}
						includeFilepath={false}
					/>
					<br />
					<Tag name="userPrompt">
						Please find out how the code block can be applied to the<br />
						editor. Provide the code changes in the format as<br />
						described above.<br />
						<br />
					</Tag>
				</UserMessage>
			</>
		);
	}
}

interface CodeBlockChangeDescriptionProps extends BasePromptElementProps {
	readonly markdownBeforeBlock?: string;
}

class CodeBlockChangeDescription extends PromptElement<CodeBlockChangeDescriptionProps> {
	render() {
		if (this.props.markdownBeforeBlock) {
			return (
				<>
					This is the description of what the code block changes:
					<br />
					<Tag name="changeDescription">
						{this.props.markdownBeforeBlock}
					</Tag>
					<br />
				</>
			);
		}
		return undefined;
	}
}

export class CodeMapperFullRewritePrompt extends PromptElement<CodeMapperPromptProps> {
	constructor(
		props: CodeMapperPromptProps,
		@IIgnoreService private readonly ignoreService: IIgnoreService,
		@IInstantiationService
		private readonly instantiationService: IInstantiationService,
	) {
		super(props);
	}

	async render(state: void, sizing: PromptSizing) {
		const shouldTrimCodeBlocks = this.props.shouldTrimCodeBlocks ?? false;
		if (isNewDocument(this.props.request)) {
			const validDocumentContext = [];
			for (const context of this.props.request.workingSet) {
				const isIgnored = await this.ignoreService.isCopilotIgnored(
					context.uri,
				);
				if (!isIgnored) {
					validDocumentContext.push(context);
				}
			}

			return (
				<>
					<references
						value={validDocumentContext.map(
							(document) => new PromptReference(document.uri),
						)}
					/>
					<SystemMessage priority={1000}>
						You are an AI programming assistant that is specialized<br />
						in generating code for a new document.<br />
						<br />
						<LegacySafetyRules />
						The user has a code block that represents a suggestion<br />
						for the contents of a single new file, and several other<br />
						files opened in a code editor.<br />
						<br />
						The provided files may contain code relevant to the new<br />
						file. Consider them when generating the new file.<br />
						<br />
						For the response, always follow these instructions:
						<br />
						1. Analyse the code block and the existing documents to<br />
						decide which parts of the existing document should be<br />
						incorporated in the generated code.<br />
						<br />
						2. If necessary, break up the code block in multiple<br />
						parts and insert each part at the appropriate location.<br />
						<br />
						3. Preserve whitespace and newlines right after the<br />
						parts of the file that you modify.<br />
						<br />
						4. The final result must be syntactically valid,<br />
						properly formatted, and correctly indented. It should<br />
						not contain any {EXISTING_CODE_MARKER} comments.
						<br />
						5. Finally, provide the full contents of the new file.
						<br />
					</SystemMessage>
					<UserMessage priority={700}>
						<PrioritizedList priority={690} descending={true}>
							{/* Skip empty files since they contain no useful context */}
							{validDocumentContext.map((document) =>
								document.lineCount === 0 ? undefined : (
									<Chunk>
										<>
											I have the following code from the
											file {document.uri.toString()} open<br />
											in the editor, starting from line 1<br />
											to line {document.lineCount}.<br />
											<CodeBlock
												uri={document.uri}
												languageId={document.languageId}
												code={document.getText()}
												shouldTrim={
													shouldTrimCodeBlocks
												}
											/>
											<br />
										</>
									</Chunk>
								),
							)}
						</PrioritizedList>
						<Chunk priority={695}>
							<CodeBlockChangeDescription
								markdownBeforeBlock={
									this.props.request.markdownBeforeBlock
								}
							/>
							This is the code block that represents the suggested<br />
							code change:<br />
							<br />
							<CodeBlock
								uri={this.props.request.uri}
								languageId={
									getLanguageForResource(
										this.props.request.uri,
									).languageId
								}
								code={this.props.request.codeBlock}
								shouldTrim={shouldTrimCodeBlocks}
							/>
							<br />
							<Tag name="userPrompt">
								Provide the contents of the new file.
							</Tag>
						</Chunk>
					</UserMessage>
					{this.props.inProgressRewriteContent && (
						<>
							<AssistantMessage priority={800}>
								{this.props.inProgressRewriteContent}
							</AssistantMessage>
							<UserMessage priority={900}>
								Please continue providing the next part of the<br />
								response.<br />
							</UserMessage>
						</>
					)}
				</>
			);
		}

		const document = this.props.request.existingDocument;
		const isIgnored = await this.ignoreService.isCopilotIgnored(
			document.uri,
		);
		if (isIgnored) {
			return <ignoredFiles value={[document.uri]} />;
		}

		const summarized =
			document instanceof NotebookDocumentSnapshot
				? await this.instantiationService
					.createInstance(NotebookDocumentSummarizer)
					.summarizeDocument(
						document,
						undefined,
						undefined,
						sizing.tokenBudget,
						{
							costFnOverride: fileVariableCostFn,
						},
					)
				: await this.instantiationService
					.createInstance(DocumentSummarizer)
					.summarizeDocument(
						document,
						undefined,
						undefined,
						sizing.tokenBudget,
						{
							costFnOverride: fileVariableCostFn,
						},
					);
		const code = summarized.text;

		return (
			<>
				<references value={[new PromptReference(document.uri)]} />
				<SystemMessage priority={1000}>
					You are an AI programming assistant that is specialized in<br />
					applying code changes to an existing document.<br />
					<br />
					<LegacySafetyRules />
					The user has a code block that represents a suggestion for a
					code change and a {document.languageId} file opened in a<br />
					code editor.<br />
					<br />
					Rewrite the existing document to fully incorporate the code<br />
					changes in the provided code block.<br />
					<br />
					For the response, always follow these instructions:
					<br />
					1. Analyse the code block and the existing document to<br />
					decide if the code block should replace existing code or<br />
					should be inserted.<br />
					<br />
					2. If necessary, break up the code block in multiple parts<br />
					and insert each part at the appropriate location.<br />
					<br />
					3. Preserve whitespace and newlines right after the parts of<br />
					the file that you modify.<br />
					<br />
					4. The final result must be syntactically valid, properly<br />
					formatted, and correctly indented. It should not contain any<br />
					...existing code... comments.<br />
					<br />
					5. Finally, provide the fully rewritten file. You must<br />
					output the complete file.<br />
					<br />
				</SystemMessage>
				<UserMessage priority={700}>
					{document.lineCount > 0 ? (
						<>
							I have the following code open in the editor,
							starting from line 1 to line {document.lineCount}.
							<br />
							<CodeBlock
								uri={document.uri}
								languageId={document.languageId}
								code={code}
								shouldTrim={shouldTrimCodeBlocks}
							/>
							<br />
						</>
					) : (
						<>I am in an empty editor.</>
					)}
					<CodeBlockChangeDescription
						markdownBeforeBlock={
							this.props.request.markdownBeforeBlock
						}
					/>
					This is the code block that represents the suggested code<br />
					change:<br />
					<br />
					<CodeBlock
						uri={document.uri}
						languageId={document.languageId}
						code={this.props.request.codeBlock}
						shouldTrim={shouldTrimCodeBlocks}
					/>
					<br />
					<Tag name="userPrompt">
						Provide the fully rewritten file, incorporating the<br />
						suggested code change. You must produce the complete<br />
						file.<br />
					</Tag>
				</UserMessage>
				{this.props.inProgressRewriteContent && (
					<>
						<AssistantMessage priority={800}>
							{this.props.inProgressRewriteContent}
						</AssistantMessage>
						<UserMessage priority={900}>
							Please continue providing the next part of the<br />
							response.<br />
						</UserMessage>
					</>
				)}
			</>
		);
	}
}

function getLastSentence(markdownBeforeBlock?: string): string | undefined {
	if (markdownBeforeBlock) {
		const whitespaces = [
			CharCode.Space,
			CharCode.Tab,
			CharCode.LineFeed,
			CharCode.CarriageReturn,
		];
		const newlines = [CharCode.LineFeed, CharCode.CarriageReturn];
		let end = markdownBeforeBlock.length;
		while (
			end > 0 &&
			whitespaces.includes(markdownBeforeBlock.charCodeAt(end - 1))
		) {
			end--;
		}
		let start = end;
		while (
			start > 0 &&
			!newlines.includes(markdownBeforeBlock.charCodeAt(start - 1))
		) {
			start--;
		}
		if (start < end) {
			return markdownBeforeBlock.substring(start, end);
		}
	}
	return undefined;
}

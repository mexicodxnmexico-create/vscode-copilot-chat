/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ToolResultContentRenderer } from '../../vscode-node/toolResultContentRenderer';
import { LanguageModelDataPart, LanguageModelPromptTsxPart, LanguageModelTextPart } from '../../../../vscodeTypes';

const mockRenderDataPartToString = vi.fn().mockReturnValue('mocked-data-part');

vi.mock('../../../prompt/vscode-node/requestLoggerToolResult', () => ({
	renderDataPartToString: (part: any) => mockRenderDataPartToString(part)
}));

describe('ToolResultContentRenderer', () => {
	let renderer: ToolResultContentRenderer;

	beforeEach(() => {
		renderer = new ToolResultContentRenderer();
		vi.clearAllMocks();
	});

	it('should return empty array for empty iterable', () => {
		const result = renderer.renderToolResultContent([]);
		expect(result).toEqual([]);
	});

	it('should render LanguageModelTextPart', () => {
		const content = [new LanguageModelTextPart('text part value')];
		const result = renderer.renderToolResultContent(content);
		expect(result).toEqual(['text part value']);
	});

	it('should render LanguageModelPromptTsxPart using JSON.stringify', () => {
		const obj = { foo: 'bar', num: 42 };
		const content = [new LanguageModelPromptTsxPart(obj)];
		const result = renderer.renderToolResultContent(content);
		expect(result).toEqual([JSON.stringify(obj, null, 2)]);
	});

	it('should gracefully handle cyclic LanguageModelPromptTsxPart', () => {
		const obj: any = { foo: 'bar' };
		obj.self = obj; // Create circular reference that JSON.stringify cannot handle
		const content = [new LanguageModelPromptTsxPart(obj)];
		const result = renderer.renderToolResultContent(content);
		expect(result).toEqual(['[PromptTsxPart]']);
	});

	it('should render LanguageModelDataPart using mocked function', () => {
		const part = new LanguageModelDataPart(new Uint8Array([1, 2, 3]), 'image/png');
		const content = [part];
		const result = renderer.renderToolResultContent(content);
		expect(result).toEqual(['mocked-data-part']);
		expect(mockRenderDataPartToString).toHaveBeenCalledWith(part);
		expect(mockRenderDataPartToString).toHaveBeenCalledTimes(1);
	});

	it('should render multiple different parts in order', () => {
		const content = [
			new LanguageModelTextPart('hello'),
			new LanguageModelPromptTsxPart({ test: true }),
			new LanguageModelDataPart(new Uint8Array([]), 'text/plain'),
			new LanguageModelTextPart('world')
		];

		const result = renderer.renderToolResultContent(content);

		expect(result).toEqual([
			'hello',
			JSON.stringify({ test: true }, null, 2),
			'mocked-data-part',
			'world'
		]);
		expect(mockRenderDataPartToString).toHaveBeenCalledTimes(1);
	});

	it('should ignore unrecognized parts', () => {
		const content = [
			new LanguageModelTextPart('first'),
			{ some: 'unknown part' },
			new LanguageModelTextPart('second')
		];

		const result = renderer.renderToolResultContent(content);
		expect(result).toEqual(['first', 'second']);
	});
});

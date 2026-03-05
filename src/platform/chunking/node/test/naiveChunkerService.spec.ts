/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NaiveChunkingService } from '../naiveChunkerService';
import { ITokenizerProvider, TokenizationEndpoint } from '../../tokenizer/node/tokenizer';
import { ITokenizer, TokenizerType } from '../../../util/common/tokenizer';
import { URI } from '../../../util/vs/base/common/uri';
import { CancellationTokenSource } from '../../../util/vs/base/common/cancellation';
import { NaiveChunker } from '../naiveChunker';

describe('NaiveChunkingService', () => {

	class MockTokenizer implements ITokenizer {
		mode = 0 as any; // OutputMode.Raw
		async countMessagesTokens() { return 0; }
		async countMessageTokens() { return 0; }
		async countToolTokens() { return 0; }
		async tokenLength(text: any) {
			if (typeof text === 'string') return text.length;
			return 0;
		}
	}

	class MockTokenizerProvider implements ITokenizerProvider {
		declare readonly _serviceBrand: undefined;
		acquireTokenizer(endpoint: TokenizationEndpoint): ITokenizer {
			return new MockTokenizer();
		}
	}

	let service: NaiveChunkingService;
	let tokenizerProvider: ITokenizerProvider;

	beforeEach(() => {
		tokenizerProvider = new MockTokenizerProvider();
		service = new NaiveChunkingService(tokenizerProvider);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return chunks for a given file', async () => {
		const endpoint = { tokenizer: TokenizerType.CL100K };
		const uri = URI.file('/test.ts');
		const text = 'line 1\nline 2\nline 3';
		const token = new CancellationTokenSource().token;

		const chunks = await service.chunkFile(endpoint, uri, text, { maxTokenLength: 10 }, token);

		expect(chunks).toBeDefined();
		expect(chunks.length).toBeGreaterThan(0);
		// Chunks should have text
		expect(chunks.every(c => c.text)).toBe(true);
	});

	it('should cache NaiveChunker instances by endpoint tokenizer', async () => {
		const endpoint1 = { tokenizer: TokenizerType.CL100K };
		const endpoint2 = { tokenizer: TokenizerType.O200K };
		const uri = URI.file('/test.ts');
		const text = 'test text';
		const token = new CancellationTokenSource().token;

		const acquireSpy = vi.spyOn(tokenizerProvider, 'acquireTokenizer');

		await service.chunkFile(endpoint1, uri, text, {}, token);
		await service.chunkFile(endpoint1, uri, text, {}, token); // Cached
		await service.chunkFile(endpoint2, uri, text, {}, token); // New

		// NaiveChunker constructor calls acquireTokenizer once per new instance
		expect(acquireSpy).toHaveBeenCalledTimes(2);
	});

	it('should filter out chunks with falsy text', async () => {
		const endpoint = { tokenizer: TokenizerType.CL100K };
		const uri = URI.file('/test.ts');
		const text = 'test text';
		const token = new CancellationTokenSource().token;

		// Mock NaiveChunker to return a chunk with empty text
		vi.spyOn(NaiveChunker.prototype, 'chunkFile').mockResolvedValue([
			{ text: 'valid chunk', range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 }, file: uri, score: 0 },
			{ text: '', range: { startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 1 }, file: uri, score: 0 }
		] as any);

		const chunks = await service.chunkFile(endpoint, uri, text, {}, token);

		expect(chunks.length).toBe(1);
		expect(chunks[0].text).toBe('valid chunk');
	});

	it('should validate chunk lengths and log a warning if exceeded limit', async () => {
		const endpoint = { tokenizer: TokenizerType.CL100K };
		const uri = URI.file('/test.ts');
		const text = 'test text';
		const token = new CancellationTokenSource().token;

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		vi.spyOn(NaiveChunker.prototype, 'chunkFile').mockResolvedValue([
			{ text: 'this is a very long string that exceeds limits', range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 50 }, file: uri, score: 0 }
		] as any);

		await service.chunkFile(endpoint, uri, text, { maxTokenLength: 10, validateChunkLengths: true }, token);

		expect(warnSpy).toHaveBeenCalledWith('Produced chunk that is over length limit', expect.objectContaining({
			file: uri.toString(),
			chunkTokenLength: 46, // length of 'this is a very long string that exceeds limits'
			maxLength: 10
		}));
	});

	it('should not log warning if validateChunkLengths is false', async () => {
		const endpoint = { tokenizer: TokenizerType.CL100K };
		const uri = URI.file('/test.ts');
		const text = 'test text';
		const token = new CancellationTokenSource().token;

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		vi.spyOn(NaiveChunker.prototype, 'chunkFile').mockResolvedValue([
			{ text: 'this is a very long string that exceeds limits', range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 50 }, file: uri, score: 0 }
		] as any);

		await service.chunkFile(endpoint, uri, text, { maxTokenLength: 10, validateChunkLengths: false }, token);

		expect(warnSpy).not.toHaveBeenCalled();
	});

});

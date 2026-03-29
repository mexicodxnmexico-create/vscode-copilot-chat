import * as assert from 'assert';
import { suite, test } from 'vitest';
import { NaiveChunkingService } from '../naiveChunkerService';
import { ITokenizerProvider, TokenizationEndpoint, TokenizerType } from '../../tokenizer/node/tokenizer';
import { CancellationToken } from '../../../util/vs/base/common/cancellation';
import { URI } from '../../../util/vs/base/common/uri';
import { ITokenizer } from '../../../util/common/tokenizer';
import { OutputMode } from '../../tokenizer/node/tokenizer';

suite('NaiveChunkingService', () => {
    // A dummy tokenizer that counts 1 token per character for simplicity in tests
    const dummyTokenizer: ITokenizer = {
        tokenLength: async (text: any) => typeof text === 'string' ? text.length : 0,
        countMessageTokens: async () => 0,
        countMessagesTokens: async () => 0,
        countToolTokens: async () => 0,
        mode: OutputMode.Raw,
    };

    const dummyTokenizerProvider: ITokenizerProvider = {
        _serviceBrand: undefined,
        acquireTokenizer: (endpoint: TokenizationEndpoint) => dummyTokenizer
    };

    const endpoint: TokenizationEndpoint = { tokenizer: TokenizerType.CL100K };
    const uri = URI.file('/test.txt');

    test('chunkFile should filter out chunks with empty text', async () => {
        const service = new NaiveChunkingService(dummyTokenizerProvider);
        const token = CancellationToken.None;

        const chunks = await service.chunkFile(endpoint, uri, "line1\n\n\nline2", { maxTokenLength: 10 }, token);

        assert.ok(chunks.every(c => c.text !== ''));
        assert.ok(chunks.length > 0);
    });

    test('chunkFile should cache NaiveChunker instances per tokenizer type', async () => {
        const service = new NaiveChunkingService(dummyTokenizerProvider);
        const token = CancellationToken.None;

        await service.chunkFile(endpoint, uri, "test", { maxTokenLength: 10 }, token);
        const chunker1 = (service as any).naiveChunkers.get(endpoint.tokenizer);
        assert.ok(chunker1);

        await service.chunkFile(endpoint, uri, "test2", { maxTokenLength: 10 }, token);
        const chunker2 = (service as any).naiveChunkers.get(endpoint.tokenizer);
        assert.strictEqual(chunker1, chunker2);

        const endpoint2: TokenizationEndpoint = { tokenizer: TokenizerType.O200K };
        await service.chunkFile(endpoint2, uri, "test3", { maxTokenLength: 10 }, token);
        const chunker3 = (service as any).naiveChunkers.get(endpoint2.tokenizer);
        assert.notStrictEqual(chunker1, chunker3);
    });

    test('validateChunkLengths should log warning if chunk exceeds maxTokenLength * 1.2', async () => {
        const service = new NaiveChunkingService(dummyTokenizerProvider);
        const token = CancellationToken.None;

        let warnCalled = false;
        let loggedMaxTokenLength = 0;
        const originalWarn = console.warn;
        console.warn = (message: string, data: any) => {
            if (message === 'Produced chunk that is over length limit') {
                warnCalled = true;
                loggedMaxTokenLength = data.maxLength;
            }
        };

        try {
            // Inject a mock chunker that produces a large chunk
            const chunker = (service as any).getNaiveChunker(endpoint);
            chunker.chunkFile = async () => [{
                text: 'this is a very long string that exceeds the max token length significantly',
                file: uri,
                range: { startLineNumber: 1, endLineNumber: 1, startColumn: 1, endColumn: 1 }
            }];

            await service.chunkFile(endpoint, uri, "dummy", { maxTokenLength: 10, validateChunkLengths: true }, token);

            assert.strictEqual(warnCalled, true);
            assert.strictEqual(loggedMaxTokenLength, 10);
        } finally {
            console.warn = originalWarn;
        }
    });

    test('validateChunkLengths should NOT log warning if chunk is within limit', async () => {
        const service = new NaiveChunkingService(dummyTokenizerProvider);
        const token = CancellationToken.None;

        let warnCalled = false;
        const originalWarn = console.warn;
        console.warn = (message: string) => {
            if (message === 'Produced chunk that is over length limit') {
                warnCalled = true;
            }
        };

        try {
            const chunker = (service as any).getNaiveChunker(endpoint);
            chunker.chunkFile = async () => [{
                text: 'short',
                file: uri,
                range: { startLineNumber: 1, endLineNumber: 1, startColumn: 1, endColumn: 1 }
            }];

            await service.chunkFile(endpoint, uri, "dummy", { maxTokenLength: 10, validateChunkLengths: true }, token);

            assert.strictEqual(warnCalled, false);
        } finally {
            console.warn = originalWarn;
        }
    });

    test('validateChunkLengths should NOT run if option is false', async () => {
        const service = new NaiveChunkingService(dummyTokenizerProvider);
        const token = CancellationToken.None;

        let warnCalled = false;
        const originalWarn = console.warn;
        console.warn = (message: string) => {
            if (message === 'Produced chunk that is over length limit') {
                warnCalled = true;
            }
        };

        try {
            const chunker = (service as any).getNaiveChunker(endpoint);
            chunker.chunkFile = async () => [{
                text: 'this is a very long string that exceeds the max token length significantly',
                file: uri,
                range: { startLineNumber: 1, endLineNumber: 1, startColumn: 1, endColumn: 1 }
            }];

            await service.chunkFile(endpoint, uri, "dummy", { maxTokenLength: 10, validateChunkLengths: false }, token);

            assert.strictEqual(warnCalled, false);
        } finally {
            console.warn = originalWarn;
        }
    });
});

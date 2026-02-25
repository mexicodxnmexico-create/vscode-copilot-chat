import { assert, describe, it } from 'vitest';
import { stripChunkTextMetadata } from './chunkingStringUtils';

describe('stripChunkTextMetadata', () => {
	it('should return text as is if it does not match the format', () => {
		const text = 'Some random text\nFile: test.ts\n```\ncontent\n```';
		// Does not start with "File: "
		assert.strictEqual(stripChunkTextMetadata(text), text);
	});

	it('should return text as is if it starts with File: but missing code block start', () => {
		const text = 'File: test.ts\nNo code block here\n```\ncontent\n```';
		assert.strictEqual(stripChunkTextMetadata(text), text);
	});

	it('should return text as is if it starts with File: and code block start but missing code block end', () => {
		const text = 'File: test.ts\n```ts\ncontent\nNo end block';
		assert.strictEqual(stripChunkTextMetadata(text), text);
	});

	it('should strip metadata correctly for simple case', () => {
		const text = 'File: test.ts\n```ts\nconst x = 1;\n```';
		const expected = 'const x = 1;';
		assert.strictEqual(stripChunkTextMetadata(text), expected);
	});

	it('should strip metadata correctly with multiple lines of content', () => {
		const text = 'File: test.ts\n```ts\nline 1\nline 2\nline 3\n```';
		const expected = 'line 1\nline 2\nline 3';
		assert.strictEqual(stripChunkTextMetadata(text), expected);
	});

	it('should strip metadata correctly with empty content', () => {
		const text = 'File: test.ts\n```ts\n```';
		const expected = '';
		assert.strictEqual(stripChunkTextMetadata(text), expected);
	});

	it('should handle windows line endings in input', () => {
		const text = 'File: test.ts\r\n```ts\r\nline 1\r\nline 2\r\n```';
		// splitLines splits \r\n -> lines are ["File: test.ts", "```ts", "line 1", "line 2", "```"]
		// join('\n') puts \n back.
		const expected = 'line 1\nline 2';
		assert.strictEqual(stripChunkTextMetadata(text), expected);
	});

	it('should handle mixed line endings if splitLines supports it', () => {
		const text = 'File: test.ts\n```ts\r\nline 1\nline 2\r\n```';
		// "File: test.ts", "```ts", "line 1", "line 2", "```"
		const expected = 'line 1\nline 2';
		assert.strictEqual(stripChunkTextMetadata(text), expected);
	});

    it('should return text if fewer than 3 lines', () => {
        const text = 'File: test.ts\n```ts';
        assert.strictEqual(stripChunkTextMetadata(text), text);
    });

    it('should return text if last line does not start with ```', () => {
        const text = 'File: test.ts\n```ts\ncontent\nend';
        assert.strictEqual(stripChunkTextMetadata(text), text);
    });

    it('should work when last line has content after ```', () => {
        // lines.at(-1).startsWith('```')
        const text = 'File: test.ts\n```ts\ncontent\n``` ends here';
        const expected = 'content';
        assert.strictEqual(stripChunkTextMetadata(text), expected);
    });
});

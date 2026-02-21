// @vitest-environment jsdom
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert, test } from 'vitest';
import { sanitize } from './sanitization';

test('sanitize adds rel="noopener noreferrer" to target="_blank" links', () => {
	const input = '<a href="https://example.com" target="_blank">Link</a>';
	const output = sanitize(input);
	assert.ok(output.includes('rel="noopener noreferrer"'), 'Output should contain rel="noopener noreferrer"');
	assert.ok(output.includes('target="_blank"'), 'Output should contain target="_blank"');
});

test('sanitize preserves existing rel attributes', () => {
	const input = '<a href="https://example.com" target="_blank" rel="nofollow">Link</a>';
	const output = sanitize(input);
	// DOMPurify might reorder or format attributes, so checking for inclusion is safer.
	// However, the exact value depends on how DOMPurify merges them. usually space separated.
	// But let's check if both are present.
	assert.ok(output.includes('nofollow'), 'Output should contain nofollow');
	assert.ok(output.includes('noopener'), 'Output should contain noopener');
	assert.ok(output.includes('noreferrer'), 'Output should contain noreferrer');
});

test('sanitize does not affect links without target="_blank"', () => {
	const input = '<a href="https://example.com">Link</a>';
	const output = sanitize(input);
	assert.ok(!output.includes('rel="noopener noreferrer"'), 'Output should not contain rel="noopener noreferrer"');
});

test('sanitize removes dangerous tags', () => {
	const input = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
	const output = sanitize(input);
	assert.ok(!output.includes('<script>'), 'Output should not contain script tag');
	assert.ok(!output.includes('onerror'), 'Output should not contain onerror attribute');
});

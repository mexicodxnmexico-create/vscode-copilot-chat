/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @vitest-environment jsdom

import { suite, test, expect } from 'vitest';
import { sanitize } from './sanitization';

suite('sanitization', () => {
	test('adds rel="noopener noreferrer" to links with target="_blank"', () => {
		const input = '<a href="https://example.com" target="_blank">Link</a>';
		const output = sanitize(input);
		expect(output).toContain('rel="noopener noreferrer"');
		expect(output).toContain('target="_blank"');
		expect(output).toContain('href="https://example.com"');
	});

	test('does not add rel="noopener noreferrer" to links without target="_blank"', () => {
		const input = '<a href="https://example.com">Link</a>';
		const output = sanitize(input);
		expect(output).not.toContain('rel="noopener noreferrer"');
		expect(output).toContain('href="https://example.com"');
	});

	test('preserves existing rel attribute but ensures noopener noreferrer is present', () => {
		const input = '<a href="https://example.com" target="_blank" rel="nofollow">Link</a>';
		const output = sanitize(input);
		expect(output).toContain('noopener');
		expect(output).toContain('noreferrer');
		expect(output).toContain('nofollow');
	});

	test('works with other HTML content', () => {
		const input = '<p>Hello <b>World</b></p>';
		const output = sanitize(input);
		expect(output).toBe('<p>Hello <b>World</b></p>');
	});
});

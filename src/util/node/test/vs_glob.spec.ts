/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';

// Mock platform BEFORE importing glob
vi.mock('../../vs/base/common/platform', async (importOriginal) => {
    const mod = await importOriginal<typeof import('../../vs/base/common/platform')>();
    return {
        ...mod,
        isLinux: false // Simulate Windows/Mac behavior where !isLinux is true
    };
});

import * as glob from '../../vs/base/common/glob';

describe('VS Code Glob (Windows Simulation)', () => {
	it('isEqualOrParent respects ignoreCase: false option (removing forced case-insensitivity)', () => {
		const base = '/foo/bar';
		const pattern = '**/*.txt';
		const relativePattern = { base, pattern };

		// By default (or explicitly false), we expect case sensitivity if !isLinux logic is removed.
		// Currently !isLinux causes this to be case INSENSITIVE on non-Linux.
		const parsed = glob.parse(relativePattern, { ignoreCase: false });

		// This path has different case than base '/foo/bar'.
		// If case sensitive (desired), this should be null.
		// If case insensitive (current), this matches.
		const match = parsed('/FOO/BAR/baz.txt');

		// If the TODO is addressed, this assertion should PASS (match is null).
		// Before the fix, this assertion should FAIL (match is not null).
		expect(match).toBeNull();
	});

	it('isEqualOrParent respects ignoreCase: true option', () => {
		const base = '/foo/bar';
		const pattern = '**/*.txt';
		const relativePattern = { base, pattern };

		const parsed = glob.parse(relativePattern, { ignoreCase: true });

		const match = parsed('/FOO/BAR/baz.txt');
		expect(match).toBeTruthy();
	});
});

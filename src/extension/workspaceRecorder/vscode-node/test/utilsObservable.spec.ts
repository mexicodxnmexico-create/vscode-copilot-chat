/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { rangeToOffsetRange } from '../utilsObservable';
import { OffsetRange } from '../../../../util/vs/editor/common/core/ranges/offsetRange';

describe('utilsObservable', () => {
	describe('rangeToOffsetRange', () => {
		it('converts a vscode.Range to an OffsetRange', () => {
			const startPos = { line: 0, character: 0 } as vscode.Position;
			const endPos = { line: 1, character: 5 } as vscode.Position;
			const mockRange = {
				start: startPos,
				end: endPos
			} as vscode.Range;

			const mockDocument = {
				offsetAt: (position: vscode.Position) => {
					if (position === startPos) {
						return 10;
					}
					if (position === endPos) {
						return 50;
					}
					return 0;
				}
			} as vscode.TextDocument;

			const result = rangeToOffsetRange(mockRange, mockDocument);

			expect(result).toBeInstanceOf(OffsetRange);
			expect(result.start).toBe(10);
			expect(result.endExclusive).toBe(50);
		});

		it('handles a range where start and end are the same', () => {
			const pos = { line: 2, character: 10 } as vscode.Position;
			const mockRange = {
				start: pos,
				end: pos
			} as vscode.Range;

			const mockDocument = {
				offsetAt: (position: vscode.Position) => {
					if (position === pos) {
						return 100;
					}
					return 0;
				}
			} as vscode.TextDocument;

			const result = rangeToOffsetRange(mockRange, mockDocument);

			expect(result).toBeInstanceOf(OffsetRange);
			expect(result.start).toBe(100);
			expect(result.endExclusive).toBe(100);
		});
	});
});

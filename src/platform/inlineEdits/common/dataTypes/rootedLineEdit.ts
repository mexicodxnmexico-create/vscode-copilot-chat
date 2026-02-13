/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { groupAdjacentBy } from '../../../../util/vs/base/common/arrays';
import { LineEdit, LineReplacement } from '../../../../util/vs/editor/common/core/edits/lineEdit';
import { BaseStringEdit, StringEdit } from '../../../../util/vs/editor/common/core/edits/stringEdit';
import { AbstractText, StringText } from '../../../../util/vs/editor/common/core/text/abstractText';
import { ensureDependenciesAreSet } from '../../../../util/vs/editor/common/core/text/positionToOffset';
import { RootedEdit } from './edit';

ensureDependenciesAreSet();

export class RootedLineEdit {
	public static fromEdit<TEdit extends BaseStringEdit>(edit: RootedEdit<TEdit>): RootedLineEdit {
		const lineEdit = LineEdit.fromStringEdit(edit.edit as BaseStringEdit as StringEdit, edit.base);
		return new RootedLineEdit(edit.base, lineEdit);
	}

	constructor(
		public readonly base: AbstractText,
		public readonly edit: LineEdit,
	) { }


	public toString(): string {
		return this.computeHumanReadablePatch();
	}

	private computeHumanReadablePatch(): string {
		const result: string[] = [];
		const originalLineCount = this.base.length.lineCount + 1;

		function pushLine(originalLineNumber: number, modifiedLineNumber: number, kind: 'unmodified' | 'deleted' | 'added', content: string | undefined) {
			const specialChar = (kind === 'unmodified' ? ' ' : (kind === 'deleted' ? '-' : '+'));

			if (content === undefined) {
				content = '[[[[[ WARNING: LINE DOES NOT EXIST ]]]]]';
			}

			const origLn = originalLineNumber === -1 ? '   ' : originalLineNumber.toString().padStart(3, ' ');
			const modLn = modifiedLineNumber === -1 ? '   ' : modifiedLineNumber.toString().padStart(3, ' ');

			result.push(`${specialChar} ${origLn} ${modLn} ${content}`);
		}

		function pushSeperator() {
			result.push('---');
		}

		let lineDelta = 0;
		let first = true;

		for (const edits of groupAdjacentBy(this.edit.replacements, (e1, e2) => e1.lineRange.distanceToRange(e2.lineRange) <= 5)) {
			if (!first) {
				pushSeperator();
			} else {
				first = false;
			}

			let lastLineNumber = edits[0].lineRange.startLineNumber - 2;

			for (const edit of edits) {
				for (let i = Math.max(1, lastLineNumber); i < edit.lineRange.startLineNumber; i++) {
					const line = (i <= originalLineCount) ? this.base.getLineAt(i) : undefined;
					pushLine(i, i + lineDelta, 'unmodified', line);
				}

				const range = edit.lineRange;
				const newLines = edit.newLines;
				for (const replaceLineNumber of range.mapToLineArray(n => n)) {
					const line = (replaceLineNumber >= 1 && replaceLineNumber <= originalLineCount) ? this.base.getLineAt(replaceLineNumber) : undefined;
					pushLine(replaceLineNumber, -1, 'deleted', line);
				}
				for (let i = 0; i < newLines.length; i++) {
					const line = newLines[i];
					pushLine(-1, range.startLineNumber + lineDelta + i, 'added', line);
				}

				lastLineNumber = range.endLineNumberExclusive;

				lineDelta += edit.newLines.length - edit.lineRange.length;
			}

			for (let i = lastLineNumber; i <= Math.min(lastLineNumber + 2, originalLineCount); i++) {
				pushLine(i, i + lineDelta, 'unmodified', this.base.getLineAt(i));
			}
		}

		return result.join('\n');
	}

	public toEdit(): StringEdit {
		return this.edit.toEdit(this.base);
	}

	public toRootedEdit(): RootedEdit {
		const base = this.base instanceof StringText ? this.base : new StringText(this.base.getValue());
		return new RootedEdit(base, this.toEdit());
	}

	public getEditedState(): string[] {
		const lines = this.base.getLines();
		const newLines = this.edit.apply(lines);
		return newLines;
	}

	public removeCommonSuffixPrefixLines(): RootedLineEdit {
		const isNotEmptyEdit = (edit: LineReplacement) => !edit.lineRange.isEmpty || edit.newLines.length > 0;
		const newEdit = this.edit.replacements.map(e => e.removeCommonSuffixPrefixLines(this.base)).filter(e => isNotEmptyEdit(e));
		return new RootedLineEdit(this.base, new LineEdit(newEdit));
	}
}

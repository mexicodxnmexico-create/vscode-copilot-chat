/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class TsExpr {
	static str(value: string): TsExpr;
	static str(strings: TemplateStringsArray, ...values: unknown[]): TsExpr;
	static str(strings: TemplateStringsArray | string, ...values: unknown[]): TsExpr {
		if (typeof strings === 'string') {
			return new TsExpr([strings]);
		} else {
			const parts: (string | { value: unknown })[] = [];
			for (let i = 0; i < strings.length; i++) {
				parts.push(strings[i]);
				if (i < values.length) {
					parts.push({ value: values[i] });
				}
			}

			removeIndentation(parts);

			return new TsExpr(parts);
		}

	}

	constructor(public readonly parts: (string | { value: unknown })[]) { }

	toString() {
		return _serializeToTs(this, 0);
	}
}

function _serializeToTs(data: unknown, newLineIndentation: number): string {
	if (data && typeof data === 'object') {

		if (data instanceof TsExpr) {
			let lastIndentation = 0;
			const result = data.parts.map(p => {
				if (typeof p === 'string') {
					lastIndentation = getIndentOfLastLine(p);
					return p;
				} else {
					return _serializeToTs(p.value, lastIndentation);
				}
			}).join('');

			return indentNonFirstLines(result, newLineIndentation);
		}

		if (Array.isArray(data)) {
			const entries: string[] = [];
			for (const value of data) {
				entries.push(_serializeToTs(value, newLineIndentation + 1));
			}

			return `[\n`
				+ entries.map(e => indentLine(e, newLineIndentation + 1) + ',\n').join('')
				+ indentLine(`]`, newLineIndentation);
		}

		const entries: string[] = [];
		for (const [key, value] of Object.entries(data)) {
			entries.push(`${serializeObjectKey(key)}: ${_serializeToTs(value, newLineIndentation + 1)},\n`);
		}
		return `{\n`
			+ entries.map(e => indentLine(e, newLineIndentation + 1)).join('')
			+ indentLine(`}`, newLineIndentation);
	}

	if (data === undefined) {
		return indentNonFirstLines('undefined', newLineIndentation);
	}

	return indentNonFirstLines(JSON.stringify(data, undefined, '\t'), newLineIndentation);
}

function getIndentOfLastLine(str: string): number {
	const lines = str.split('\n');
	const lastLine = lines[lines.length - 1];
	return lastLine.length - lastLine.trimStart().length;
}

function indentNonFirstLines(str: string, indentation: number): string {
	const lines = str.split('\n');
	return lines.map((line, i) => i === 0 ? line : indentLine(line, indentation)).join('\n');
}

function indentLine(str: string, indentation: number): string {
	return '\t'.repeat(indentation) + str;
}

function serializeObjectKey(key: string): string {
	if (/^[a-zA-Z_]\w*$/.test(key)) {
		return key;
	}
	return JSON.stringify(key);
}


function removeIndentation(parts: (string | { value: unknown })[]): void {
	let minIndentLength = Infinity;

	let fullStr = '';
	for (const p of parts) {
		if (typeof p === 'string') {
			fullStr += p;
		} else {
			fullStr += '__X__';
		}
	}

	const lines = fullStr.split('\n');
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		const isOnlyWhitespace = line.trim().length === 0;
		const isLastLine = i === lines.length - 1;

		if (!isOnlyWhitespace || (isLastLine && line.length > 0)) {
			const match = line.match(/^[ \t]*/);
			const len = match ? match[0].length : 0;
			if (len < minIndentLength) {
				minIndentLength = len;
			}
		}
	}

	if (minIndentLength === Infinity) {
		minIndentLength = 0;
	}

	if (minIndentLength > 0) {
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (typeof part === 'string') {
				const partLines = part.split('\n');
				for (let j = 0; j < partLines.length; j++) {
					// Only remove indentation if this is actually the start of a line
					// The first element of split('\n') is NOT following a newline unless it's the very first part
					// Wait, if it's the first element of split('\n') on part > 0, it means it's on the SAME line as the previous variable.
					// So it's never the start of a new line. We should skip j === 0.
					if (j === 0) { continue; }

					const line = partLines[j];
					const indentMatch = line.match(/^[ \t]*/);
					const indentLength = indentMatch ? indentMatch[0].length : 0;

					const sliceLen = Math.min(minIndentLength, indentLength);
					partLines[j] = line.substring(sliceLen);
				}
				parts[i] = partLines.join('\n');
			}
		}
	}

	if (parts.length > 0 && typeof parts[0] === 'string') {
		const firstPart = parts[0] as string;
		const match = firstPart.match(/^\n/);
		if (match) {
			parts[0] = firstPart.substring(match[0].length);
		}
	}

	if (parts.length > 0 && typeof parts[parts.length - 1] === 'string') {
		const lastPart = parts[parts.length - 1] as string;
		const match = lastPart.match(/\n[ \t]*$/);
		if (match) {
			parts[parts.length - 1] = lastPart.substring(0, lastPart.length - match[0].length);
		}
	}
}

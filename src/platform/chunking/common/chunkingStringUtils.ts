/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { splitLines } from '../../../util/vs/base/common/strings';

export function truncateToMaxUtf8Length(str: string, maxBytes: number): string {
	// utf-16 strings have at most 4 bytes per character (2 * 2)
	// If we're under that, skip the more expensive checks
	const upperEstimatedByteLength = str.length * 4;
	if (upperEstimatedByteLength <= maxBytes) {
		return str;
	}

	const encoder = new TextEncoder();
	const encodedStr = encoder.encode(str);

	if (encodedStr.length <= maxBytes) {
		return str;
	}

	const truncatedBytes = encodedStr.slice(0, maxBytes);

	// Decode the truncated bytes back to a string, ensuring no partial characters
	return new TextDecoder().decode(truncatedBytes, {
		stream: true // Don't emit partial characters
	});
}

/**
 * Returned chunks are formatted with extra metadata:
 *
 * File: `fileName.ext`:
 * ```lang
 * chunk text
 * ```
 *
 * Try to strip this out
 */

export function stripChunkTextMetadata(text: string): string {
	if (!text.startsWith('File: ')) {
		return text;
	}

	const re = /\r\n|\r|\n/g;
	const match1 = re.exec(text);
	if (!match1) {
		return text;
	}

	const secondLineStart = match1.index + match1[0].length;
	// Check if we have a second line at all
	const match2 = re.exec(text);
	if (!match2) {
		return text;
	}

	// Check if second line starts with ```
	// We check substring from secondLineStart to match2.index
	// Actually we just need to check startsWith at the offset
	if (!text.startsWith('```', secondLineStart)) {
		return text;
	}

	// Find the last line start
	let lastSepIndex = -1;
	let lastSepLength = 0;

	// Scan backwards for the last separator
	for (let i = text.length - 1; i >= secondLineStart; i--) {
		const c = text.charCodeAt(i);
		if (c === 10) { // \n
			if (i > 0 && text.charCodeAt(i - 1) === 13) { // \r
				lastSepIndex = i - 1;
				lastSepLength = 2;
			} else {
				lastSepIndex = i;
				lastSepLength = 1;
			}
			break;
		} else if (c === 13) { // \r
			lastSepIndex = i;
			lastSepLength = 1;
			break;
		}
	}

	// Calculate where the last line starts
	// If no separator found after match2 (or lastSepIndex IS match2),
	// then the last line starts after match2.
	let lastLineStart: number;
	if (lastSepIndex > match2.index) {
		lastLineStart = lastSepIndex + lastSepLength;
	} else {
		// Only 2 separators found, so last line starts after the second one
		lastLineStart = match2.index + match2[0].length;
		// Update lastSepIndex to match2 for contentEnd calculation
		lastSepIndex = match2.index;
	}

	// Check if last line starts with ```
	if (!text.startsWith('```', lastLineStart)) {
		return text;
	}

	const contentStart = match2.index + match2[0].length;
	const contentEnd = lastSepIndex;

	if (contentEnd <= contentStart) {
		return '';
	}

	// Extract and normalize newlines to \n
	return text.substring(contentStart, contentEnd).replace(/\r\n|\r/g, '\n');
}

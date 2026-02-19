/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { readFileSync } from 'fs';
import { readVariableLengthQuantity } from '../../../util/common/variableLengthQuantity';
import { VSBuffer } from '../../../util/vs/base/common/buffer';

/** See `script/build/compressTikToken.ts` */
export const parseTikTokenBinary = (file: string): Map<Uint8Array, number> => {
	const contents = readFileSync(file);
	// Hoist VSBuffer.wrap to avoid allocation in the loop
	const contentsBuffer = VSBuffer.wrap(contents);
	const result = new Map<Uint8Array, number>();

	for (let i = 0; i < contents.length;) {
		const termLength = readVariableLengthQuantity(contentsBuffer, i);
		i += termLength.consumed;
		result.set(contents.subarray(i, i + termLength.value), result.size);
		i += termLength.value;
	}

	return result;
};

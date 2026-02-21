/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import DOMPurify from 'dompurify';

DOMPurify.addHook('afterSanitizeAttributes', function (node) {
	if ('target' in node && node.getAttribute('target') === '_blank') {
		const rels = (node.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
		if (!rels.includes('noopener')) {
			rels.push('noopener');
		}
		if (!rels.includes('noreferrer')) {
			rels.push('noreferrer');
		}
		node.setAttribute('rel', rels.join(' '));
	}
});

export function sanitize(content: string): string {
	return DOMPurify.sanitize(content, { ADD_ATTR: ['target'] }) as string;
}

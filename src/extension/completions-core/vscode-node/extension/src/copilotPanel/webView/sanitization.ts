/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import DOMPurify from 'dompurify';

export interface SolutionItem {
	htmlSnippet: string;
	citation?: {
		message: string;
		url: string;
	};
}

export function renderSolutionItem(solution: SolutionItem, index: number): string {
	const renderedCitation = solution.citation
		? `<p>
			<span style="vertical-align: text-bottom" aria-hidden="true">Warning</span>
			${DOMPurify.sanitize(solution.citation.message)}
			<a href="${DOMPurify.sanitize(solution.citation.url)}" target="_blank" rel="noopener noreferrer">Inspect source code</a>
		  </p>`
		: '';
	const sanitizedSnippet = DOMPurify.sanitize(solution.htmlSnippet);

	// When sanitizing the full renderedCitation, we must allow 'target' and 'rel' attributes
	// so that our security fix (rel="noopener noreferrer") and target="_blank" are preserved.
	const sanitizedCitation = DOMPurify.sanitize(renderedCitation, { ADD_ATTR: ['target', 'rel'] });

	return `<h3 class='solutionHeading' id="solution-${index + 1}-heading">Suggestion ${index + 1}</h3>
	<div class='snippetContainer' aria-labelledby="solution-${index + 1}-heading" role="group" data-solution-index="${index}">${sanitizedSnippet
		}</div>
	${sanitizedCitation}
	<vscode-button role="button" class="acceptButton" id="acceptButton${index}" appearance="secondary" data-solution-index="${index}">Accept suggestion ${index + 1
		}</vscode-button>`;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@vscode/webview-ui-toolkit', () => ({
	provideVSCodeDesignSystem: () => ({
		register: vi.fn(),
	}),
	vsCodeButton: vi.fn(),
}));

vi.mock('dompurify', () => ({
	default: {
		sanitize: (str: string) => str,
	},
}));

describe('SuggestionsPanelWebview', () => {
	let solutionsContainer: HTMLDivElement;
	let loadingContainer: HTMLDivElement;

	beforeEach(async () => {
		// Reset DOM
		document.body.innerHTML = `
			<div id="solutionsContainer"></div>
			<div id="loadingContainer">
				<label>Loading suggestions:</label>
				<progress id="progress-bar"></progress>
			</div>
		`;

		solutionsContainer = document.getElementById('solutionsContainer') as HTMLDivElement;
		loadingContainer = document.getElementById('loadingContainer') as HTMLDivElement;

		// Mock acquireVsCodeApi
		vi.stubGlobal('acquireVsCodeApi', () => ({
			postMessage: vi.fn(),
			setState: vi.fn(),
			getState: vi.fn(),
		}));

		// We need to reload the module for each test to re-run the top-level code
		vi.resetModules();
		await import('./suggestionsPanelWebview');
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('renders citation with warning', async () => {
		const message = {
			command: 'solutionsUpdated',
			solutions: [
				{
					htmlSnippet: '<div>Code snippet</div>',
					citation: {
						message: 'Similar code detected',
						url: 'https://example.com/source',
					},
				},
			],
			percentage: 100,
		};

		window.postMessage(message, '*');

		// Wait for the event loop to process the message
		await new Promise((resolve) => setTimeout(resolve, 0));

		const citationParagraph = solutionsContainer.querySelector('p');
		expect(citationParagraph).toBeTruthy();

		// Check for the warning span
		const warningSpan = citationParagraph?.querySelector('span');
		expect(warningSpan).toBeTruthy();
		// The warning text is now "⚠ Warning:", encoded as &#9888; Warning:
		// textContent decodes entities
		expect(warningSpan?.textContent).toBe('⚠ Warning:');

		// Check for semantic emphasis
		const strong = warningSpan?.querySelector('strong');
		expect(strong).toBeTruthy();
		expect(strong?.textContent).toBe('⚠ Warning:');

		// Check for the link
		const link = citationParagraph?.querySelector('a');
		expect(link).toBeTruthy();
		expect(link?.getAttribute('href')).toBe('https://example.com/source');
		expect(link?.textContent).toBe('Inspect source code');

		// Check for rel="noopener noreferrer" (should be present now)
		expect(link?.getAttribute('rel')).toBe('noopener noreferrer');

		// Check that aria-hidden is NOT present on warning span (should be removed for accessibility)
		expect(warningSpan?.hasAttribute('aria-hidden')).toBe(false);
	});
});

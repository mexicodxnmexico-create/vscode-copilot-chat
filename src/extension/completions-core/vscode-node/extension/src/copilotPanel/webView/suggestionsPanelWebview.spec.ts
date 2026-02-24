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

vi.mock('dompurify', () => {
    return {
	default: {
		sanitize: (str: string) => str, // Simple pass-through for testing structure
	},
    };
});

describe('suggestionsPanelWebview', () => {
    let container: HTMLElement;
    let loadingContainer: HTMLElement;

    beforeEach(async () => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="loadingContainer">
                <label>Loading suggestions:</label>
                <progress id="progress-bar"></progress>
            </div>
            <div id="solutionsContainer"></div>
        `;
        container = document.getElementById('solutionsContainer')!;
        loadingContainer = document.getElementById('loadingContainer')!;

        // Mock acquireVsCodeApi
        (window as any).acquireVsCodeApi = () => ({
		postMessage: vi.fn(),
		setState: vi.fn(),
		getState: vi.fn(),
        });

        // Import the module to run the script
        vi.resetModules();
        await import('./suggestionsPanelWebview');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('renders citation with warning correctly', async () => {
        const message = {
		command: 'solutionsUpdated',
		solutions: [
			{
				htmlSnippet: '<pre>code</pre>',
				citation: {
					message: 'Similar code detected',
					url: 'http://example.com',
				},
			},
		],
		percentage: 100,
        };

        // Dispatch message
        window.postMessage(message, '*');

        // Wait for any potential async updates
        await new Promise(resolve => setTimeout(resolve, 0));

        // Let's inspect the container
        const solutions = container.innerHTML;

        // Verify FIXED behavior
        // Check for presence of rel="noopener noreferrer"
        // Note: URL normalization adds a trailing slash to the hostname
        expect(solutions).toContain('<a href="http://example.com/" target="_blank" rel="noopener noreferrer">Inspect source code</a>');

        // Check for improved warning (visible, bold, with icon hidden from screen reader)
        // Note: innerHTML might escape entities differently depending on jsdom version.
        // We check for the structure where the icon is hidden and the text is visible.
        expect(solutions).toContain('<span style="vertical-align: text-bottom"><span aria-hidden="true">⚠</span> <strong>Warning:</strong></span>');
    });

    it('updates aria-busy state on solutionsContainer', async () => {
        // Send partial update
        const loadingMessage = {
            command: 'solutionsUpdated',
            solutions: [],
            percentage: 50,
        };
        window.postMessage(loadingMessage, '*');
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(container.getAttribute('aria-busy')).toBe('true');

        // Send complete update
        const completeMessage = {
            command: 'solutionsUpdated',
            solutions: [],
            percentage: 100,
        };
        window.postMessage(completeMessage, '*');
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(container.getAttribute('aria-busy')).toBe('false');
    });

    it('does not render malicious citation URL', async () => {
        const message = {
            command: 'solutionsUpdated',
            solutions: [
                {
                    htmlSnippet: '<pre>code</pre>',
                    citation: {
                        message: 'Similar code detected',
                        // Malicious URL
                        url: 'javascript:alert(1)',
                    },
                },
            ],
            percentage: 100,
        };

        // Dispatch message
        window.postMessage(message, '*');

        // Wait for any potential async updates
        await new Promise(resolve => setTimeout(resolve, 0));

        // Let's inspect the container
        const solutions = container.innerHTML;

        // Expect the href to be sanitized to '#'
        expect(solutions).toContain('href="#"');
        expect(solutions).not.toContain('javascript:alert(1)');
    });

    it('sanitizes attribute injection attempts', async () => {
        const message = {
            command: 'solutionsUpdated',
            solutions: [
                {
                    htmlSnippet: '<pre>code</pre>',
                    citation: {
                        message: 'Similar code detected',
                        // Malicious URL attempting attribute injection
                        url: 'http://example.com/" onclick="alert(1)',
                    },
                },
            ],
            percentage: 100,
        };

        // Dispatch message
        window.postMessage(message, '*');

        // Wait for any potential async updates
        await new Promise(resolve => setTimeout(resolve, 0));

        // Let's inspect the container
        const solutions = container.innerHTML;

        // The URL should be normalized (double quote encoded as %22)
        // Note: The specific encoding might depend on the URL implementation,
        // but it definitely shouldn't contain the raw quote followed by onclick
        expect(solutions).not.toContain('onclick="alert(1)"');

        // Check for safe encoding. URL() usually encodes " as %22.
        // DOMPurify might further encode it.
        // We verify that the 'href' attribute starts correctly and doesn't close prematurely.
        expect(solutions).toMatch(/href="http:\/\/example\.com\/%22%20onclick=%22alert\(1\)"/);
    });
});

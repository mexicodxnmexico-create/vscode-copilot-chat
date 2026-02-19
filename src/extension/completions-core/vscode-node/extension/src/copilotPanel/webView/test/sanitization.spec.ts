/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderSolutionItem, SolutionItem } from '../sanitization';
import DOMPurify from 'dompurify';

// Mock DOMPurify
vi.mock('dompurify', () => {
    return {
	default: {
		sanitize: vi.fn((input, config) => {
                // Simple mock implementation that returns input.
                // In a real environment, it would strip attributes unless configured.
                // Here we verify the configuration is passed correctly.
                return input;
            }),
	},
    };
});

describe('renderSolutionItem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add rel="noopener noreferrer" to citation links', () => {
        const solution: SolutionItem = {
		htmlSnippet: '<div>code</div>',
		citation: {
			message: 'Citation message',
			url: 'https://example.com'
		}
        };

        const result = renderSolutionItem(solution, 0);

        // Check that the anchor tag has the correct attributes
        expect(result).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">Inspect source code</a>');
    });

    it('should call DOMPurify.sanitize with allowed attributes', () => {
        const solution: SolutionItem = {
		htmlSnippet: '<div>code</div>',
		citation: {
			message: 'Citation message',
			url: 'https://example.com'
		}
        };

        renderSolutionItem(solution, 0);

        // Verify DOMPurify.sanitize was called with the correct configuration for the citation block
        // The citation block contains the anchor tag
        expect(DOMPurify.sanitize).toHaveBeenCalledWith(
		expect.stringContaining('<a href='),
		{ ADD_ATTR: ['target', 'rel'] }
        );
    });

    it('should sanitize inputs', () => {
        const solution: SolutionItem = {
		htmlSnippet: '<script>alert(1)</script>',
		citation: {
			message: '<b>Message</b>',
			url: 'javascript:alert(1)'
		}
        };

        renderSolutionItem(solution, 0);

        // Verify individual components are sanitized
        expect(DOMPurify.sanitize).toHaveBeenCalledWith('<script>alert(1)</script>');
        expect(DOMPurify.sanitize).toHaveBeenCalledWith('<b>Message</b>');
        expect(DOMPurify.sanitize).toHaveBeenCalledWith('javascript:alert(1)');
    });
});

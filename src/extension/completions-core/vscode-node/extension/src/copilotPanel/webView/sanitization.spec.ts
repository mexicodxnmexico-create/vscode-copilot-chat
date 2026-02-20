import { describe, it, expect, vi } from 'vitest';
import { renderCitation } from './sanitization';

// Mock DOMPurify
vi.mock('dompurify', () => {
	return {
		default: {
			sanitize: (str: string) => str, // Mock sanitize to return input string
		},
	};
});

describe('renderCitation', () => {
	it('should render citation with sanitized message and url, and include rel="noopener noreferrer"', () => {
		const citation = {
			message: 'Test Message',
			url: 'https://example.com',
		};

		const result = renderCitation(citation);

		expect(result).toContain('Test Message');
		expect(result).toContain('href="https://example.com"');
		expect(result).toContain('target="_blank"');
		expect(result).toContain('rel="noopener noreferrer"');
	});

	it('should handle special characters in message and url (mock assumes sanitize returns input)', () => {
		// Since we mocked sanitize to be identity, we are testing the structure, not the sanitization logic itself (which is DOMPurify's job)
		const citation = {
			message: '<b>Bold</b>',
			url: 'javascript:alert(1)',
		};

		const result = renderCitation(citation);

		expect(result).toContain('<b>Bold</b>');
		expect(result).toContain('href="javascript:alert(1)"');
		expect(result).toContain('rel="noopener noreferrer"');
	});
});

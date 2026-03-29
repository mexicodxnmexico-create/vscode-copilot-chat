import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { tryParseJson } from '../jsonFile';

describe('tryParseJson', () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
		vi.restoreAllMocks();
	});

	it('should successfully parse valid JSON', () => {
		const validJson = '{"key": "value", "num": 42}';
		const result = tryParseJson(validJson);
		expect(result).toEqual({ key: 'value', num: 42 });
		expect(consoleErrorSpy).not.toHaveBeenCalled();
	});

	it('should return undefined and log error for invalid JSON (SyntaxError)', () => {
		const invalidJson = '{"key": "value", }'; // Trailing comma
		const result = tryParseJson(invalidJson);
		expect(result).toBeUndefined();
		expect(consoleErrorSpy).toHaveBeenCalledOnce();
		expect(consoleErrorSpy.mock.calls[0][0]).toBeInstanceOf(SyntaxError);
	});

	it('should throw error if JSON.parse throws a non-SyntaxError', () => {
		// Mock JSON.parse to throw a generic Error
		const genericError = new Error('Generic error');
		const jsonParseSpy = vi.spyOn(JSON, 'parse').mockImplementation(() => {
			throw genericError;
		});

		expect(() => tryParseJson('{"a":1}')).toThrow(genericError);
		expect(consoleErrorSpy).not.toHaveBeenCalled();

		jsonParseSpy.mockRestore();
	});
});

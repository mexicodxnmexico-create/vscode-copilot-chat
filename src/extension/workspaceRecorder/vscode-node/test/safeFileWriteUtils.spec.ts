import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FlushableJSONFile, FlushableSafeJSONLFile } from '../safeFileWriteUtils';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('safeFileWriteUtils', () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'safeFileWriteUtils-'));
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	describe('FlushableJSONFile', () => {
		it('should load initial value if file does not exist', async () => {
			const filePath = path.join(tempDir, 'test.json');
			const initialValue = { a: 1 };
			const file = await FlushableJSONFile.loadOrCreate(filePath, initialValue);

			expect(file.value).toEqual(initialValue);
			expect(fs.existsSync(filePath)).toBe(false); // Does not create the file immediately
		});

		it('should load existing valid JSON', async () => {
			const filePath = path.join(tempDir, 'test.json');
			const existingValue = { b: 2 };
			fs.writeFileSync(filePath, JSON.stringify(existingValue), 'utf8');

			const file = await FlushableJSONFile.loadOrCreate(filePath, { a: 1 });
			expect(file.value).toEqual(existingValue);
		});

		it('should fallback to initial value if existing file is invalid JSON', async () => {
			const filePath = path.join(tempDir, 'test.json');
			fs.writeFileSync(filePath, 'invalid json', 'utf8');

			// tryParseJson logs to console.error on invalid JSON, so let's mock it to keep test output clean
			const originalConsoleError = console.error;
			console.error = () => {};

			const initialValue = { a: 1 };
			const file = await FlushableJSONFile.loadOrCreate(filePath, initialValue);
			expect(file.value).toEqual(initialValue);

			console.error = originalConsoleError;
		});

		it('should flushAsync new value correctly', async () => {
			const filePath = path.join(tempDir, 'test.json');
			const file = await FlushableJSONFile.loadOrCreate(filePath, { a: 1 });

			file.setValue({ a: 2 });
			await file.flushAsync();

			expect(fs.existsSync(filePath)).toBe(true);
			const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			expect(content).toEqual({ a: 2 });
		});

		it('should not write anything on flushAsync if not dirty', async () => {
			const filePath = path.join(tempDir, 'test.json');
			const file = await FlushableJSONFile.loadOrCreate(filePath, { a: 1 });

			await file.flushAsync();
			expect(fs.existsSync(filePath)).toBe(false);
		});

		it('should flushSync new value correctly', async () => {
			const filePath = path.join(tempDir, 'test.json');
			const file = await FlushableJSONFile.loadOrCreate(filePath, { a: 1 });

			file.setValue({ a: 2 });
			file.flushSync();

			expect(fs.existsSync(filePath)).toBe(true);
			const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			expect(content).toEqual({ a: 2 });
		});

		it('should handle unlinking existing file on flushAsync', async () => {
			const filePath = path.join(tempDir, 'test.json');
			fs.writeFileSync(filePath, JSON.stringify({ a: 1 }), 'utf8');

			const file = await FlushableJSONFile.loadOrCreate(filePath, { a: 1 });
			file.setValue({ a: 2 });
			await file.flushAsync();

			const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			expect(content).toEqual({ a: 2 });
		});

		it('should handle unlinking existing file on flushSync', async () => {
			const filePath = path.join(tempDir, 'test.json');
			fs.writeFileSync(filePath, JSON.stringify({ a: 1 }), 'utf8');

			const file = await FlushableJSONFile.loadOrCreate(filePath, { a: 1 });
			file.setValue({ a: 2 });
			file.flushSync();

			const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			expect(content).toEqual({ a: 2 });
		});
	});

	describe('FlushableSafeJSONLFile', () => {
		it('should flushAsync entries correctly', async () => {
			const filePath = path.join(tempDir, 'test.jsonl');
			const file = new FlushableSafeJSONLFile<{ a: number }>(filePath);

			file.appendEntry({ a: 1 });
			file.appendEntry({ a: 2 });
			await file.flushAsync();

			expect(fs.existsSync(filePath)).toBe(true);
			const content = fs.readFileSync(filePath, 'utf8');
			expect(content).toBe('\n{"a":1}\n{"a":2}');
		});

		it('should not write anything on flushAsync if empty', async () => {
			const filePath = path.join(tempDir, 'test.jsonl');
			const file = new FlushableSafeJSONLFile<{ a: number }>(filePath);

			await file.flushAsync();
			expect(fs.existsSync(filePath)).toBe(false);
		});

		it('should flushSync entries correctly', async () => {
			const filePath = path.join(tempDir, 'test.jsonl');
			const file = new FlushableSafeJSONLFile<{ a: number }>(filePath);

			file.appendEntry({ a: 1 });
			file.appendEntry({ a: 2 });
			file.flushSync();

			expect(fs.existsSync(filePath)).toBe(true);
			const content = fs.readFileSync(filePath, 'utf8');
			expect(content).toBe('\n{"a":1}\n{"a":2}');
		});

		it('should throw BugIndicatingError on recursive lock for flushAsync', async () => {
			const filePath = path.join(tempDir, 'test.jsonl');
			const file = new FlushableSafeJSONLFile<{ a: number }>(filePath);
			file.appendEntry({ a: 1 });

			// Simulate lock
			(file as any)._lock = true;
			await expect(file.flushAsync()).rejects.toThrow('Locked!');
		});

		it('should throw BugIndicatingError on recursive lock for flushSync', () => {
			const filePath = path.join(tempDir, 'test.jsonl');
			const file = new FlushableSafeJSONLFile<{ a: number }>(filePath);
			file.appendEntry({ a: 1 });

			// Simulate lock
			(file as any)._lock = true;
			expect(() => file.flushSync()).toThrow('Locked!');
		});
	});
});

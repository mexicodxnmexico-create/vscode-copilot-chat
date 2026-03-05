/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';
import { suite, test, beforeEach, afterEach } from 'vitest';
import { JSONFile, readFileTextOrUndefined, tryParseJson } from '../jsonFile';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'fs/promises';

suite('JSONFile', function () {
	let tmpDir: string;

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'jsonFile-test-'));
	});

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true });
	});

	suite('readOrCreate', () => {
		test('creates new instance with initial value when file does not exist', async () => {
			const filePath = join(tmpDir, 'new.json');
			const initial = { foo: 'bar' };
			const jsonFile = await JSONFile.readOrCreate(filePath, initial);

			assert.deepStrictEqual(jsonFile.value, initial);
			assert.strictEqual(jsonFile.filePath, filePath);
			// Does not automatically write to disk immediately upon readOrCreate
			const fileExists = await readFileTextOrUndefined(filePath);
			assert.strictEqual(fileExists, undefined);
		});

		test('reads existing valid json', async () => {
			const filePath = join(tmpDir, 'existing.json');
			const existingData = { foo: 'baz', count: 42 };
			await writeFile(filePath, JSON.stringify(existingData));

			const jsonFile = await JSONFile.readOrCreate(filePath, { foo: 'bar' });
			assert.deepStrictEqual(jsonFile.value, existingData);
		});

		test('falls back to initial value if existing file is invalid json', async () => {
			const filePath = join(tmpDir, 'invalid.json');
			await writeFile(filePath, '{ foo: "bar" '); // Invalid JSON syntax

			const initial = { foo: 'bar' };
			const jsonFile = await JSONFile.readOrCreate(filePath, initial);
			assert.deepStrictEqual(jsonFile.value, initial);
		});
	});

	suite('value and setValue', () => {
		test('value getter returns a deep clone', async () => {
			const filePath = join(tmpDir, 'clone.json');
			const initial = { nested: { val: 1 } };
			const jsonFile = await JSONFile.readOrCreate(filePath, initial);

			const val1 = jsonFile.value;
			val1.nested.val = 2; // Mutate the retrieved value

			// The original value inside JSONFile should remain unchanged
			assert.strictEqual(jsonFile.value.nested.val, 1);
		});

		test('setValue updates memory and writes to disk', async () => {
			const filePath = join(tmpDir, 'write.json');
			const jsonFile = await JSONFile.readOrCreate(filePath, { count: 0 });

			await jsonFile.setValue({ count: 1 });
			assert.deepStrictEqual(jsonFile.value, { count: 1 });

			// Verify it was written to disk
			const content = await readFile(filePath, 'utf8');
			assert.strictEqual(JSON.parse(content).count, 1);
		});

		test('setValue queues writes and resolves after writing', async () => {
			const filePath = join(tmpDir, 'queue.json');
			const jsonFile = await JSONFile.readOrCreate(filePath, { count: 0 });

			// Start multiple setValues concurrently
			const p1 = jsonFile.setValue({ count: 1 });
			const p2 = jsonFile.setValue({ count: 2 });
			const p3 = jsonFile.setValue({ count: 3 });

			await Promise.all([p1, p2, p3]);

			assert.deepStrictEqual(jsonFile.value, { count: 3 });
			const content = await readFile(filePath, 'utf8');
			assert.strictEqual(JSON.parse(content).count, 3);
		});
	});
});

suite('readFileTextOrUndefined', () => {
	let tmpDir: string;

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'jsonFile-test-'));
	});

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true });
	});

	test('returns file content for existing file', async () => {
		const filePath = join(tmpDir, 'test.txt');
		await writeFile(filePath, 'hello world');
		const result = await readFileTextOrUndefined(filePath);
		assert.strictEqual(result, 'hello world');
	});

	test('returns undefined for non-existent file', async () => {
		const filePath = join(tmpDir, 'missing.txt');
		const result = await readFileTextOrUndefined(filePath);
		assert.strictEqual(result, undefined);
	});

	test('throws for other read errors (e.g. directory)', async () => {
		const dirPath = join(tmpDir, 'subdir');
		await mkdir(dirPath);

		await assert.rejects(async () => {
			await readFileTextOrUndefined(dirPath);
		}, (err: any) => err.code === 'EISDIR');
	});
});

suite('tryParseJson', () => {
	test('parses valid json', () => {
		const result = tryParseJson('{"foo": "bar"}');
		assert.deepStrictEqual(result, { foo: 'bar' });
	});

	test('returns undefined for invalid json syntax', () => {
		const result = tryParseJson('{"foo": "bar"'); // Missing closing brace
		assert.strictEqual(result, undefined);
	});
});

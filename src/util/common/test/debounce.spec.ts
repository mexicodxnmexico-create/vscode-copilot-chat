/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import sinon from 'sinon';
import { assert, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { Debouncer, debounce } from '../debounce';

describe('Debouncer', () => {
	let clock: sinon.SinonFakeTimers;
	let debouncer: Debouncer;

	beforeEach(() => {
		clock = sinon.useFakeTimers();
		debouncer = new Debouncer();
	});

	afterEach(() => {
		clock.restore();
	});

	it('should resolve after the specified delay', async () => {
		const promise = debouncer.debounce(100);
		await clock.tickAsync(100);
		await expect(promise).resolves.toBeUndefined();
	});

	it('should reject previous call if another call is made before resolution', async () => {
		const promise1 = debouncer.debounce(100);
		const promise2 = debouncer.debounce(100);

		await expect(promise1).rejects.toBeUndefined();
		await clock.tickAsync(100);
		await expect(promise2).resolves.toBeUndefined();
	});

	it('should allow subsequent calls after resolution', async () => {
		const promise1 = debouncer.debounce(50);
		await clock.tickAsync(50);
		await expect(promise1).resolves.toBeUndefined();

		const promise2 = debouncer.debounce(50);
		await clock.tickAsync(50);
		await expect(promise2).resolves.toBeUndefined();
	});
});

describe('debounce function', () => {
	let clock: sinon.SinonFakeTimers;

	beforeEach(() => {
		clock = sinon.useFakeTimers();
	});

	afterEach(() => {
		clock.restore();
	});

	it('should debounce multiple calls', async () => {
		const callback = sinon.stub().returns('result');
		const debounced = debounce(100, callback);

		debounced();
		debounced();
		const promise = debounced();

		sinon.assert.notCalled(callback);

		await clock.tickAsync(100);

		sinon.assert.calledOnce(callback);
		await expect(promise).resolves.toBe('result');
	});

	it('should pass arguments correctly', async () => {
		const callback = sinon.stub().returns('result');
		const debounced = debounce(100, callback);

		debounced('arg1', 'arg2');
		await clock.tickAsync(100);

		sinon.assert.calledWith(callback, 'arg1', 'arg2');
	});

	it('should resolve with the return value of the callback', async () => {
		const callback = sinon.stub().returns(42);
		const debounced = debounce(100, callback);

		const promise = debounced();
		await clock.tickAsync(100);

		await expect(promise).resolves.toBe(42);
	});
});

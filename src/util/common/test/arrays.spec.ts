import { assert, describe, it } from 'vitest';
import { min } from '../arrays';

describe('arrays', () => {
	describe('min', () => {
		it('should return Infinity for empty array', () => {
			assert.strictEqual(min([]), Infinity);
		});

		it('should return the minimum value', () => {
			assert.strictEqual(min([1, 2, 3]), 1);
			assert.strictEqual(min([3, 2, 1]), 1);
			assert.strictEqual(min([2, 1, 3]), 1);
		});

		it('should handle negative numbers', () => {
			assert.strictEqual(min([-1, -2, -3]), -3);
		});

		it('should handle Infinity', () => {
			assert.strictEqual(min([Infinity, 1, 2]), 1);
			assert.strictEqual(min([Infinity, Infinity]), Infinity);
		});

		it('should handle NaN (Math.min behavior)', () => {
			assert.ok(Number.isNaN(min([1, NaN, 2])));
			assert.ok(Number.isNaN(min([NaN, 1])));
		});
	});
});

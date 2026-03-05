import { describe, expect, it } from 'vitest';
import { JSONL } from '../jsonlUtil';

describe('JSONL', () => {
    describe('parse', () => {
        it('should parse a basic JSONL string into an array of objects', () => {
            const input = '{"id": 1, "name": "Alice"}\n{"id": 2, "name": "Bob"}';
            const expected = [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' }
            ];
            expect(JSONL.parse(input)).toEqual(expected);
        });

        it('should ignore empty lines', () => {
            const input = '{"id": 1}\n\n{"id": 2}\n';
            const expected = [{ id: 1 }, { id: 2 }];
            expect(JSONL.parse(input)).toEqual(expected);
        });

        it('should ignore lines with only whitespace', () => {
            const input = '{"id": 1}\n  \n\t\n{"id": 2}';
            const expected = [{ id: 1 }, { id: 2 }];
            expect(JSONL.parse(input)).toEqual(expected);
        });

        it('should handle an empty string', () => {
            const input = '';
            const expected: any[] = [];
            expect(JSONL.parse(input)).toEqual(expected);
        });

        it('should throw an error on invalid JSON data', () => {
            const input = '{"id": 1}\ninvalid-json\n{"id": 2}';
            expect(() => JSONL.parse(input)).toThrow(SyntaxError);
        });

        it('should handle strings, numbers, and booleans', () => {
            const input = '"string"\n123\ntrue\nfalse\nnull';
            const expected = ['string', 123, true, false, null];
            expect(JSONL.parse(input)).toEqual(expected);
        });
    });

    describe('toString', () => {
        it('should convert an array of objects to a JSONL string', () => {
            const input = [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' }
            ];
            const expected = '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}';
            expect(JSONL.toString(input)).toEqual(expected);
        });

        it('should handle an empty array', () => {
            const input: any[] = [];
            const expected = '';
            expect(JSONL.toString(input)).toEqual(expected);
        });

        it('should handle arrays of strings, numbers, booleans, and nulls', () => {
            const input = ['string', 123, true, false, null];
            const expected = '"string"\n123\ntrue\nfalse\nnull';
            expect(JSONL.toString(input)).toEqual(expected);
        });
    });
});

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { extractIdentifier, isDocumentableNode } from '../../node/util';
import type { SyntaxNode } from 'web-tree-sitter';
import { WASMLanguage } from '../../node/treeSitterLanguages';

function createMockNode(type: string, text?: string, children: SyntaxNode[] = []): SyntaxNode {
	return {
		type,
		text: text || type,
		children
	} as unknown as SyntaxNode;
}

describe('util', () => {
	describe('extractIdentifier', () => {
		// Python / C#
		it('extracts identifier for python/csharp', () => {
			const node = createMockNode('function_definition', '', [
				createMockNode('def'),
				createMockNode('identifier', 'myFunction'),
				createMockNode('parameters')
			]);
			expect(extractIdentifier(node, 'python')).toBe('myFunction');
			expect(extractIdentifier(node, 'csharp')).toBe('myFunction');
		});

		it('returns undefined if no identifier found for python/csharp', () => {
			const node = createMockNode('function_definition', '', [
				createMockNode('def'),
				createMockNode('parameters')
			]);
			expect(extractIdentifier(node, 'python')).toBeUndefined();
		});

		// Go
		it('extracts identifier directly for go', () => {
			const node = createMockNode('function_declaration', '', [
				createMockNode('func'),
				createMockNode('identifier', 'MyFunc'),
				createMockNode('parameters')
			]);
			expect(extractIdentifier(node, 'go')).toBe('MyFunc');
		});

		it('extracts identifier from spec for go', () => {
			const node = createMockNode('type_declaration', '', [
				createMockNode('type'),
				createMockNode('type_spec', '', [
					createMockNode('type_identifier', 'MyType')
				])
			]);
			expect(extractIdentifier(node, 'go')).toBe('MyType');
		});

		it('returns undefined if no identifier or spec found for go', () => {
			const node = createMockNode('type_declaration', '', [
				createMockNode('type')
			]);
			expect(extractIdentifier(node, 'go')).toBeUndefined();
		});

		// JS / TS / C++
		it('extracts identifier from declarator for js/ts/cpp', () => {
			const node = createMockNode('variable_declaration', '', [
				createMockNode('let'),
				createMockNode('variable_declarator', '', [
					createMockNode('identifier', 'myVar')
				])
			]);
			expect(extractIdentifier(node, 'javascript')).toBe('myVar');
			expect(extractIdentifier(node, 'typescript')).toBe('myVar');
			expect(extractIdentifier(node, 'cpp')).toBe('myVar');
		});

		it('extracts direct identifier for js/ts/cpp', () => {
			const node = createMockNode('function_declaration', '', [
				createMockNode('function'),
				createMockNode('identifier', 'myFunction')
			]);
			expect(extractIdentifier(node, 'javascript')).toBe('myFunction');
			expect(extractIdentifier(node, 'typescript')).toBe('myFunction');
			expect(extractIdentifier(node, 'cpp')).toBe('myFunction');
		});

		it('returns undefined if no identifier found for js/ts/cpp', () => {
			const node = createMockNode('variable_declaration', '', [
				createMockNode('let')
			]);
			expect(extractIdentifier(node, 'javascript')).toBeUndefined();
		});

		// Java
		it('extracts identifier for java', () => {
			const node = createMockNode('class_declaration', '', [
				createMockNode('class'),
				createMockNode('identifier', 'MyClass')
			]);
			expect(extractIdentifier(node, 'java')).toBe('MyClass');
		});

		it('returns undefined if no identifier found for java', () => {
			const node = createMockNode('class_declaration', '', [
				createMockNode('class'),
				createMockNode('type_identifier', 'MyClass') // type_identifier instead of identifier
			]);
			expect(extractIdentifier(node, 'java')).toBeUndefined();
		});

		// Ruby
		it('extracts identifier or constant for ruby', () => {
			const node1 = createMockNode('method', '', [
				createMockNode('def'),
				createMockNode('identifier', 'my_method')
			]);
			expect(extractIdentifier(node1, 'ruby')).toBe('my_method');

			const node2 = createMockNode('class', '', [
				createMockNode('class'),
				createMockNode('constant', 'MyClass')
			]);
			expect(extractIdentifier(node2, 'ruby')).toBe('MyClass');
		});

		// Default
		it('extracts identifier as default', () => {
			const node = createMockNode('some_node', '', [
				createMockNode('some_identifier', 'myIdent')
			]);
			expect(extractIdentifier(node, 'unknown_lang')).toBe('myIdent');
		});
	});

	describe('isDocumentableNode', () => {
		it('returns true for JS/TS valid nodes', () => {
			const node = createMockNode('function_declaration');
			expect(isDocumentableNode(node, WASMLanguage.JavaScript)).toBeTruthy();
		});

		it('returns false for JS/TS invalid nodes', () => {
			const node = createMockNode('identifier');
			expect(isDocumentableNode(node, WASMLanguage.JavaScript)).toBeFalsy();
		});

		it('returns true for Go valid nodes', () => {
			const node = createMockNode('var_spec');
			expect(isDocumentableNode(node, WASMLanguage.Go)).toBeTruthy();
		});

		it('returns false for Go invalid nodes', () => {
			const node = createMockNode('identifier');
			expect(isDocumentableNode(node, WASMLanguage.Go)).toBeFalsy();
		});

		it('returns true for C++ valid nodes', () => {
			const node = createMockNode('class_specifier');
			expect(isDocumentableNode(node, WASMLanguage.Cpp)).toBeTruthy();
		});

		it('returns false for C++ invalid nodes', () => {
			const node = createMockNode('identifier');
			expect(isDocumentableNode(node, WASMLanguage.Cpp)).toBeFalsy();
		});

		it('returns true for Ruby valid nodes', () => {
			const node = createMockNode('method');
			expect(isDocumentableNode(node, WASMLanguage.Ruby)).toBeTruthy();
		});

		it('returns false for Ruby invalid nodes', () => {
			const node = createMockNode('identifier');
			expect(isDocumentableNode(node, WASMLanguage.Ruby)).toBeFalsy();
		});

		it('returns true for default valid nodes', () => {
			const node = createMockNode('function_definition');
			// Use a language not explicitly matched in the switch
			expect(isDocumentableNode(node, WASMLanguage.Python)).toBeTruthy();
		});

		it('returns false for default invalid nodes', () => {
			const node = createMockNode('identifier');
			expect(isDocumentableNode(node, WASMLanguage.Python)).toBeFalsy();
		});
	});
});

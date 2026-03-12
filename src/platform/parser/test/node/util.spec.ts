/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, suite, test } from 'vitest';
import { isDocumentableNode } from '../../node/util';
import { WASMLanguage } from '../../node/treeSitterLanguages';
import type { SyntaxNode } from 'web-tree-sitter';

suite('isDocumentableNode', () => {
	function createMockNode(type: string): SyntaxNode {
		return { type } as SyntaxNode;
	}

	test('TypeScript/JavaScript/Tsx should return match for definition, declaration, declarator, export_statement', () => {
		const types = ['definition', 'declaration', 'declarator', 'export_statement'];
		for (const type of types) {
			const node = createMockNode(type);
			expect(isDocumentableNode(node, WASMLanguage.TypeScript)).toBeTruthy();
			expect(isDocumentableNode(node, WASMLanguage.JavaScript)).toBeTruthy();
			expect(isDocumentableNode(node, WASMLanguage.TypeScriptTsx)).toBeTruthy();
		}
	});

	test('Go should return match for definition, declaration, declarator, var_spec', () => {
		const types = ['definition', 'declaration', 'declarator', 'var_spec'];
		for (const type of types) {
			const node = createMockNode(type);
			expect(isDocumentableNode(node, WASMLanguage.Go)).toBeTruthy();
		}
	});

	test('Cpp should return match for definition, declaration, class_specifier', () => {
		const types = ['definition', 'declaration', 'class_specifier'];
		for (const type of types) {
			const node = createMockNode(type);
			expect(isDocumentableNode(node, WASMLanguage.Cpp)).toBeTruthy();
		}
	});

	test('Ruby should return match for module, class, method, assignment', () => {
		const types = ['module', 'class', 'method', 'assignment'];
		for (const type of types) {
			const node = createMockNode(type);
			expect(isDocumentableNode(node, WASMLanguage.Ruby)).toBeTruthy();
		}
	});

	test('Default languages should return match for definition, declaration, declarator', () => {
		const types = ['definition', 'declaration', 'declarator'];
		const defaultLanguages = [
			WASMLanguage.Python,
			WASMLanguage.Csharp,
			WASMLanguage.Java,
			WASMLanguage.Rust,
		];

		for (const lang of defaultLanguages) {
			for (const type of types) {
				const node = createMockNode(type);
				expect(isDocumentableNode(node, lang)).toBeTruthy();
			}
		}
	});

	test('Should return null for non-matching type for specific languages', () => {
		const node = createMockNode('identifier');
		expect(isDocumentableNode(node, WASMLanguage.TypeScript)).toBeFalsy();
		expect(isDocumentableNode(node, WASMLanguage.Go)).toBeFalsy();
		expect(isDocumentableNode(node, WASMLanguage.Cpp)).toBeFalsy();
		expect(isDocumentableNode(node, WASMLanguage.Ruby)).toBeFalsy();
		expect(isDocumentableNode(node, WASMLanguage.Python)).toBeFalsy();
	});
});

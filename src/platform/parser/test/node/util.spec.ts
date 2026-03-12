/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { suite, test, expect } from 'vitest';
import { extractIdentifier, isDocumentableNode } from '../../node/util';
import { _parse } from '../../node/parserWithCaching';
import { WASMLanguage } from '../../node/treeSitterLanguages';

suite('extractIdentifier', () => {
    test('extracts identifier correctly for python', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Python, 'class MyClass: pass');
        try {
		const node = parseTreeRef.tree.rootNode.children[0];
		const result = extractIdentifier(node, WASMLanguage.Python);
		expect(result).toBe('MyClass');
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('extracts identifier correctly for csharp', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Csharp, 'class MyClass {}');
        try {
		const node = parseTreeRef.tree.rootNode.children[0];
		const result = extractIdentifier(node, WASMLanguage.Csharp);
		expect(result).toBe('MyClass');
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('extracts identifier correctly for go (spec fallback)', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Go, 'type MyStruct struct {}');
        try {
		const node = parseTreeRef.tree.rootNode.children[0];
		const result = extractIdentifier(node, WASMLanguage.Go);
		expect(result).toBe('MyStruct');
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('extracts identifier correctly for go (direct identifier)', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Go, 'func myFunc() {}');
        try {
		const node = parseTreeRef.tree.rootNode.children[0];
		const result = extractIdentifier(node, WASMLanguage.Go);
		expect(result).toBe('myFunc');
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('extracts identifier correctly for javascript/typescript (declarator fallback)', async () => {
        const parseTreeRef = await _parse(WASMLanguage.TypeScript, 'const myVar = 1;');
        try {
		const node = parseTreeRef.tree.rootNode.children[0].children[1]; // Get lexical_declaration -> variable_declarator
		const result = extractIdentifier(node, WASMLanguage.TypeScript);
		expect(result).toBe('myVar');
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('extracts identifier correctly for javascript/typescript (direct identifier)', async () => {
        const parseTreeRef = await _parse(WASMLanguage.TypeScript, 'function myFunc() {}');
        try {
		const node = parseTreeRef.tree.rootNode.children[0];
		const result = extractIdentifier(node, WASMLanguage.TypeScript);
		expect(result).toBe('myFunc');
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('extracts identifier correctly for java', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Java, 'class MyJavaClass {}');
        try {
		const node = parseTreeRef.tree.rootNode.children[0];
		const result = extractIdentifier(node, WASMLanguage.Java);
		expect(result).toBe('MyJavaClass');
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('extracts identifier correctly for ruby', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Ruby, 'class MyRubyClass; end');
        try {
		const node = parseTreeRef.tree.rootNode.children[0];
		const result = extractIdentifier(node, WASMLanguage.Ruby);
		expect(result).toBe('MyRubyClass');
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('extracts identifier correctly for default case (rust)', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Rust, 'struct MyRustStruct {}');
        try {
		const node = parseTreeRef.tree.rootNode.children[0];
		const result = extractIdentifier(node, WASMLanguage.Rust);
		expect(result).toBe('MyRustStruct');
        } finally {
		parseTreeRef.dispose();
        }
    });
});

suite('isDocumentableNode', () => {
    test('identifies documentable nodes for typescript/javascript', async () => {
        const parseTreeRef = await _parse(WASMLanguage.TypeScript, 'function foo() {}\nconst x = 1;');
        try {
		const definitionNode = parseTreeRef.tree.rootNode.children[0]; // function foo() {}
		const declaratorNode = parseTreeRef.tree.rootNode.children[1].children[1]; // const x = 1; (variable_declarator)
		expect(isDocumentableNode(definitionNode, WASMLanguage.TypeScript)).toBeTruthy();
		expect(isDocumentableNode(declaratorNode, WASMLanguage.TypeScript)).toBeTruthy();
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('identifies documentable nodes for go', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Go, 'func foo() {}\ntype MyStruct struct {}');
        try {
		const definitionNode = parseTreeRef.tree.rootNode.children[0];
		const typeSpecNode = parseTreeRef.tree.rootNode.children[1]; // type MyStruct struct {} (type_declaration) -> matches /declaration/
		expect(isDocumentableNode(definitionNode, WASMLanguage.Go)).toBeTruthy();
		expect(isDocumentableNode(typeSpecNode, WASMLanguage.Go)).toBeTruthy();
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('identifies documentable nodes for cpp', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Cpp, 'class MyClass {};');
        try {
		const definitionNode = parseTreeRef.tree.rootNode.children[0];
		expect(isDocumentableNode(definitionNode, WASMLanguage.Cpp)).toBeTruthy();
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('identifies documentable nodes for ruby', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Ruby, 'class MyClass; end');
        try {
		const definitionNode = parseTreeRef.tree.rootNode.children[0];
		expect(isDocumentableNode(definitionNode, WASMLanguage.Ruby)).toBeTruthy();
        } finally {
		parseTreeRef.dispose();
        }
    });

    test('identifies documentable nodes for default case (cpp fallback for default)', async () => {
        const parseTreeRef = await _parse(WASMLanguage.Cpp, 'void myfunc() {}\nint x = 1;');
        try {
		const definitionNode = parseTreeRef.tree.rootNode.children[0]; // function_definition
		const declaratorNode = parseTreeRef.tree.rootNode.children[1].children[1]; // declaration -> init_declarator
		// Use WASMLanguage.Rust to hit the default case, but we pass C++ nodes which have 'definition' and 'declarator' types
		expect(isDocumentableNode(definitionNode, WASMLanguage.Rust)).toBeTruthy();
		expect(isDocumentableNode(declaratorNode, WASMLanguage.Rust)).toBeTruthy();
        } finally {
		parseTreeRef.dispose();
        }
    });
});

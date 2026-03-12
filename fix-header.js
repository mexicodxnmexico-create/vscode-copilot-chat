const fs = require('fs');
const filepath = 'src/platform/parser/test/node/util.spec.ts';
let content = fs.readFileSync(filepath, 'utf8');
const header = `/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/\n\n`;
if (!content.startsWith('/*')) {
    fs.writeFileSync(filepath, header + content);
}

const fs = require('fs');

const content = fs.readFileSync('src/extension/onboardDebug/node/debuggableCommandIdentifier.ts', 'utf8');
const match = content.match(/export function extractCommandNameFromCLI[\s\S]*?\n\}/);
if (!match) {
    throw new Error('Could not find extractCommandNameFromCLI');
}
const funcCode = match[0].replace('export ', '').replace('command: string', 'command');

const script = `
${funcCode}

const tests = [
	{ input: "node index.js", expected: "node" },
	{ input: "  node index.js", expected: "node" },
	{ input: "\\"C:\\\\Program Files\\\\nodejs\\\\node.exe\\" index.js", expected: "C:\\\\Program Files\\\\nodejs\\\\node.exe" },
	{ input: "'C:\\\\Program Files\\\\nodejs\\\\node.exe' index.js", expected: "C:\\\\Program Files\\\\nodejs\\\\node.exe" },
	{ input: "FOO=bar node index.js", expected: "node" },
	{ input: "FOO=bar BAZ=qux node index.js", expected: "node" },
	{ input: "FOO=\\"bar baz\\" node index.js", expected: "node" },
	{ input: "FOO='bar baz' node index.js", expected: "node" },
	{ input: "FOO='bar baz' \\"C:\\\\Program Files\\\\node.exe\\"", expected: "C:\\\\Program Files\\\\node.exe" },
	{ input: "VAR=1 cmd=2 node index.js", expected: "node" },
	{ input: "VAR=1", expected: "VAR=1" },
	{ input: "", expected: "" },
    { input: "NODE_ENV=production npm run build", expected: "npm" }
];

let failed = 0;
for (const t of tests) {
    const actual = extractCommandNameFromCLI(t.input);
    if (actual !== t.expected) {
        console.error(\`FAILED: input "\${t.input}" -> expected "\${t.expected}", actual "\${actual}"\`);
        failed++;
    } else {
        console.log(\`PASSED: "\${t.input}" -> "\${actual}"\`);
    }
}
if (failed > 0) process.exit(1);
console.log("ALL TESTS PASSED");
`;

fs.writeFileSync('test_manual.js', script);

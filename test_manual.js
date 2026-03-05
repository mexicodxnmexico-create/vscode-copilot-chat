
function extractCommandNameFromCLI(command) {
	let inSingleQuote = false;
	let inDoubleQuote = false;
	let currentToken = '';

	for (let i = 0; i < command.length; i++) {
		const char = command[i];

		if (char === '\\' && !inSingleQuote) {
			currentToken += char;
			if (i + 1 < command.length) {
				currentToken += command[i + 1];
				i++;
			}
			continue;
		}

		if (char === "'" && !inDoubleQuote) {
			inSingleQuote = !inSingleQuote;
			currentToken += char;
		} else if (char === '"' && !inSingleQuote) {
			inDoubleQuote = !inDoubleQuote;
			currentToken += char;
		} else if ((char === ' ' || char === '\t') && !inSingleQuote && !inDoubleQuote) {
			if (currentToken.length > 0) {
				if (!/^[a-zA-Z_][a-zA-Z0-9_]*=/.test(currentToken)) {
					break;
				}
				currentToken = '';
			}
		} else {
			currentToken += char;
		}
	}

	if (currentToken.length === 0) {
		const re = /\s*([^\s]+)/;
		const match = re.exec(command);
		return match ? match[1] : command;
	}

	if (currentToken.length >= 2) {
		if (currentToken.startsWith('"') && currentToken.endsWith('"')) {
			return currentToken.slice(1, -1);
		}
		if (currentToken.startsWith("'") && currentToken.endsWith("'")) {
			return currentToken.slice(1, -1);
		}
	}

	return currentToken;
}

const tests = [
	{ input: "node index.js", expected: "node" },
	{ input: "  node index.js", expected: "node" },
	{ input: "\"C:\\Program Files\\nodejs\\node.exe\" index.js", expected: "C:\\Program Files\\nodejs\\node.exe" },
	{ input: "'C:\\Program Files\\nodejs\\node.exe' index.js", expected: "C:\\Program Files\\nodejs\\node.exe" },
	{ input: "FOO=bar node index.js", expected: "node" },
	{ input: "FOO=bar BAZ=qux node index.js", expected: "node" },
	{ input: "FOO=\"bar baz\" node index.js", expected: "node" },
	{ input: "FOO='bar baz' node index.js", expected: "node" },
	{ input: "FOO='bar baz' \"C:\\Program Files\\node.exe\"", expected: "C:\\Program Files\\node.exe" },
	{ input: "VAR=1 cmd=2 node index.js", expected: "node" },
	{ input: "VAR=1", expected: "VAR=1" },
	{ input: "", expected: "" },
    { input: "NODE_ENV=production npm run build", expected: "npm" }
];

let failed = 0;
for (const t of tests) {
    const actual = extractCommandNameFromCLI(t.input);
    if (actual !== t.expected) {
        console.error(`FAILED: input "${t.input}" -> expected "${t.expected}", actual "${actual}"`);
        failed++;
    } else {
        console.log(`PASSED: "${t.input}" -> "${actual}"`);
    }
}
if (failed > 0) process.exit(1);
console.log("ALL TESTS PASSED");

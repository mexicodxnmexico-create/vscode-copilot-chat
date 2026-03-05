const fs = require('fs');
const file = 'src/extension/chatSessions/claude/node/claudeCodeAgent.ts';
let code = fs.readFileSync(file, 'utf8');

const search = `		const uriToString = (uri: URI) => uri.scheme === 'file' ? uri.fsPath : uri.toString();
		let prompt = request.prompt;
		for (const ref of request.references) {
			let refValue = ref.value;
			if (refValue instanceof ChatReferenceBinaryData) {
				const mediaType = toAnthropicImageMediaType(refValue.mimeType);
				if (mediaType) {
					const data = await refValue.data();
					contentBlocks.push({
						type: 'image',
						source: {
							type: 'base64',
							data: Buffer.from(data).toString('base64'),
							media_type: mediaType
						}
					});
					continue;
				}
				// Unsupported image type — fall through to use reference URI if available
				if (!refValue.reference) {
					continue;
				}
				refValue = refValue.reference;
			}

			const valueText = URI.isUri(refValue) ?
				uriToString(refValue) :
				isLocation(refValue) ?
					\`\${uriToString(refValue.uri)}:\${refValue.range.start.line + 1}\` :
					undefined;
			if (valueText) {
				if (ref.range) {
					prompt = prompt.slice(0, ref.range[0]) + valueText + prompt.slice(ref.range[1]);
				} else {
					extraRefsTexts.push(\`- \${valueText}\`);
				}
			}
		}`;

const replace = `		const uriToString = (uri: URI) => uri.scheme === 'file' ? uri.fsPath : uri.toString();
		let prompt = request.prompt;

		const resolvedReferences = await Promise.all(request.references.map(async (ref) => {
			let refValue = ref.value;
			if (refValue instanceof ChatReferenceBinaryData) {
				const mediaType = toAnthropicImageMediaType(refValue.mimeType);
				if (mediaType) {
					const data = await refValue.data();
					return { ref, mediaType, data };
				}
			}
			return { ref, mediaType: undefined, data: undefined };
		}));

		for (const { ref, mediaType, data } of resolvedReferences) {
			let refValue = ref.value;
			if (refValue instanceof ChatReferenceBinaryData) {
				if (mediaType && data) {
					contentBlocks.push({
						type: 'image',
						source: {
							type: 'base64',
							data: Buffer.from(data).toString('base64'),
							media_type: mediaType
						}
					});
					continue;
				}
				// Unsupported image type — fall through to use reference URI if available
				if (!refValue.reference) {
					continue;
				}
				refValue = refValue.reference;
			}

			const valueText = URI.isUri(refValue) ?
				uriToString(refValue) :
				isLocation(refValue) ?
					\`\${uriToString(refValue.uri)}:\${refValue.range.start.line + 1}\` :
					undefined;
			if (valueText) {
				if (ref.range) {
					prompt = prompt.slice(0, ref.range[0]) + valueText + prompt.slice(ref.range[1]);
				} else {
					extraRefsTexts.push(\`- \${valueText}\`);
				}
			}
		}`;

if (code.includes(search)) {
    fs.writeFileSync(file, code.replace(search, replace));
    console.log("Success");
} else {
    console.log("Failed to find search string");
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PromptElement } from '@vscode/prompt-tsx';
import { Tag } from '../base/tag';

export class FileLinkificationInstructions extends PromptElement<{}> {
	render() {
		return (
			<Tag name="fileLinkification">
				When mentioning files or line numbers, always convert them to<br />
				markdown links using workspace-relative paths and 1-based line<br />
				numbers.<br />
				<br />
				NO BACKTICKS ANYWHERE:
				<br />
				- Never wrap file names, paths, or links in backticks.
				<br />
				- Never use inline-code formatting for any file reference.
				<br />
				<br />
				REQUIRED FORMATS:
				<br />
				- File: [path/file.ts](path/file.ts)
				<br />
				- Line: [file.ts](file.ts#L10)
				<br />
				- Range: [file.ts](file.ts#L10-L12)
				<br />
				<br />
				PATH RULES:
				<br />
				- Without line numbers: Display text must match the target path.
				<br />
				- With line numbers: Display text can be either the path or<br />
				descriptive text.<br />
				<br />
				- Use '/' only; strip drive letters and external folders.
				<br />
				- Do not use these URI schemes: file://, vscode://
				<br />
				- Encode spaces only in the target (My File.md → My%20File.md).
				<br />
				- Non-contiguous lines require separate links. NEVER use<br />
				comma-separated line references like #L10-L12, L20.<br />
				<br />
				- Valid formats: [file.ts](file.ts#L10) only. Invalid:<br />
				([file.ts#L10]) or [file.ts](file.ts)#L10<br />
				<br />
				- Only create links for files that exist in the workspace. Do<br />
				not link to files you are suggesting to create or that do not<br />
				exist yet.<br />
				<br />
				<br />
				USAGE EXAMPLES:
				<br />
				- With path as display: The handler is in<br />
				[src/handler.ts](src/handler.ts#L10).<br />
				<br />
				- With descriptive text: The [widget<br />
				initialization](src/widget.ts#L321) runs on startup.<br />
				<br />
				- Bullet list: [Init widget](src/widget.ts#L321)
				<br />
				- File only: See [src/config.ts](src/config.ts) for settings.
				<br />
				<br />
				FORBIDDEN (NEVER OUTPUT):
				<br />
				- Inline code: `file.ts`, `src/file.ts`, `L86`.
				<br />
				- Plain text file names: file.ts, chatService.ts.
				<br />
				- References without links when mentioning specific file<br />
				locations.<br />
				<br />
				- Specific line citations without links ("Line 86", "at line<br />
				86", "on line 25").<br />
				<br />
				- Combining multiple line references in one link:<br />
				[file.ts#L10-L12, L20](file.ts#L10-L12, L20)<br />
				<br />
				<br />
			</Tag>
		);
	}
}

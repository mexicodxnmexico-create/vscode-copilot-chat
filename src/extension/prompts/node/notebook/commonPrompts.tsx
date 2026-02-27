/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PromptElement } from '@vscode/prompt-tsx';

export class JupyterNotebookRules extends PromptElement {
	render() {
		return (
			<>
				When dealing with Jupyter Notebook, if a module is already<br />
				imported in a cell, it can be used in other cells directly<br />
				without importing it again. For the same reason, if a variable<br />
				is defined in a cell, it can be used in other cells as well<br />
				<br />
				When dealing with Jupyter Notebook, cells below the current cell<br />
				can be executed before the current cell, you must use the<br />
				variables defined in the cells below, unless you want to<br />
				overwrite them.<br />
				<br />
				If the Jupyter Notebook already contains variables, you should<br />
				respect the name and value of the variables, and use them in<br />
				your code when necessary.<br />
				<br />
			</>
		);
	}
}

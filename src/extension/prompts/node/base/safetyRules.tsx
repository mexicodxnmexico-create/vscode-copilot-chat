/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PromptElement } from '@vscode/prompt-tsx';

export class SafetyRules extends PromptElement {
	render() {
		return (
			<>
				Follow Microsoft content policies.
				<br />
				Avoid content that violates copyrights.
				<br />
				If you are asked to generate content that is harmful, hateful,<br />
				racist, sexist, lewd, or violent, only respond with "Sorry, I<br />
				can't assist with that."<br />
				<br />
				Keep your answers short and impersonal.
				<br />
			</>
		);
	}
}

export class Gpt5SafetyRule extends PromptElement {
	render() {
		return (
			<>
				Follow Microsoft content policies.
				<br />
				Avoid content that violates copyrights.
				<br />
				If you are asked to generate content that is harmful, hateful,<br />
				racist, sexist, lewd, or violent, only respond with "Sorry, I<br />
				can't assist with that."<br />
				<br />
			</>
		);
	}
}

export class LegacySafetyRules extends PromptElement {
	render() {
		return (
			<>
				Follow Microsoft content policies.
				<br />
				Avoid content that violates copyrights.
				<br />
				If you are asked to generate content that is harmful, hateful,<br />
				racist, sexist, lewd, violent, or completely irrelevant to<br />
				software engineering, only respond with "Sorry, I can't assist<br />
				with that."<br />
				<br />
				Keep your answers short and impersonal.
				<br />
			</>
		);
	}
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect } from 'vitest';
import { PromptWorkspaceLabels } from '../../resolvers/promptWorkspaceLabels';
import { IInstantiationService } from '../../../../../util/vs/platform/instantiation/common/instantiation';
import { IExperimentationService } from '../../../../../platform/telemetry/common/nullExperimentationService';
import { IConfigurationService } from '../../../../../platform/configuration/common/configurationService';
import { ITelemetryService } from '../../../../../platform/telemetry/common/telemetry';
import { IWorkspaceService } from '../../../../../platform/workspace/common/workspaceService';
import { IFileSystemService } from '../../../../../platform/filesystem/common/fileSystemService';
import { IIgnoreService } from '../../../../../platform/ignore/common/ignoreService';
import * as toml from '@iarna/toml';

describe('PromptWorkspaceLabels', () => {
	it('should parse python toml dependencies via pyproject.toml', async () => {
		// Create mocks
		const mockExperimentationService = {} as IExperimentationService;
		const mockConfigurationService = {
			getExperimentBasedConfig: () => true // ensure Expanded strategy
		} as IConfigurationService;
		const mockTelemetryService = {
			sendMSFTTelemetryEvent: () => { }
		} as unknown as ITelemetryService;

		let expandedInstance: any;
		const mockInstantiationService = {
			createInstance: (ctor: any) => {
				const instance = new ctor(
					{
						getWorkspaceFolders: () => []
					} as unknown as IWorkspaceService,
					{} as IFileSystemService,
					{} as IIgnoreService
				);
				if (ctor.name === 'ExpandedPromptWorkspaceLabels') {
					expandedInstance = instance;
				}
				return instance;
			}
		} as unknown as IInstantiationService;

		const labels = new PromptWorkspaceLabels(
			mockExperimentationService,
			mockConfigurationService,
			mockTelemetryService,
			mockInstantiationService
		);

		await labels.collectContext();

		const parseToml = expandedInstance.contentIndicators.get('pyproject.toml');
		expect(parseToml).toBeDefined();

		const tomlContent = `
[tool.poetry.dependencies]
python = "^3.10"
numpy = "1.23.4"
pandas = "1.5.0"
something-unknown = "1.0.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.2.0"
`;
		const extractedTags = parseToml(tomlContent);


		// Our new toml implementation uses parsed.tool?.poetry?.dependencies
		// and checks popularPackages.
		expect(extractedTags).toContain('numpy-1.23.4');
		expect(extractedTags).toContain('pandas-1.5.0');

		// Unpopular ones are ignored
		expect(extractedTags).not.toContain('something-unknown-1.0.0');

		// Malformed TOML shouldn't throw but return empty array
		const malformedTags = parseToml('[[[');
		expect(malformedTags).toEqual([]);
	});
});

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ClaudeLanguageModelServer } from '../claudeLanguageModelServer';
import { ILogService } from '../../../../../platform/log/common/logService';
import { IEndpointProvider } from '../../../../../platform/endpoint/common/endpointProvider';
import { IInstantiationService } from '../../../../../util/vs/platform/instantiation/common/instantiation';
import { TestLogService } from '../../../../../platform/testing/common/testLogService';

describe('ClaudeLanguageModelServer Authentication', () => {
    let server: ClaudeLanguageModelServer;
    let logService: ILogService;
    let endpointProvider: IEndpointProvider;
    let instantiationService: IInstantiationService;

    beforeEach(async () => {
        logService = new TestLogService();
        endpointProvider = {
            getAllChatEndpoints: vi.fn().mockResolvedValue([]),
        } as unknown as IEndpointProvider;
        instantiationService = {} as unknown as IInstantiationService;

        server = new ClaudeLanguageModelServer(logService, endpointProvider, instantiationService);
        await server.start();
    });

    afterEach(() => {
        server.stop();
        server.dispose();
    });

    test('accepts valid x-api-key', async () => {
        const config = server.getConfig();
        const port = config.port;
        const nonce = config.nonce;

        const response = await fetch(`http://127.0.0.1:${port}/v1/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': nonce,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-opus-20240229',
                messages: [{ role: 'user', content: 'Hello' }]
            })
        });

        // 404 or 500 is expected because we mocked endpointProvider to return empty list
        // or because instantiationService is empty.
        // But NOT 401.
        expect(response.status).not.toBe(401);
    });

    test('accepts valid Bearer token', async () => {
        const config = server.getConfig();
        const port = config.port;
        const nonce = config.nonce;

        const response = await fetch(`http://127.0.0.1:${port}/v1/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${nonce}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-opus-20240229',
                messages: [{ role: 'user', content: 'Hello' }]
            })
        });

        expect(response.status).not.toBe(401);
    });

    test('rejects invalid x-api-key', async () => {
        const config = server.getConfig();
        const port = config.port;

        const response = await fetch(`http://127.0.0.1:${port}/v1/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': 'invalid-key',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-opus-20240229',
                messages: [{ role: 'user', content: 'Hello' }]
            })
        });

        expect(response.status).toBe(401);
    });

    test('rejects invalid Bearer token', async () => {
        const config = server.getConfig();
        const port = config.port;

        const response = await fetch(`http://127.0.0.1:${port}/v1/messages`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer invalid-token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-opus-20240229',
                messages: [{ role: 'user', content: 'Hello' }]
            })
        });

        expect(response.status).toBe(401);
    });
});

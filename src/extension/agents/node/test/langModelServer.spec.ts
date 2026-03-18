/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LanguageModelServer } from '../langModelServer';
import { ILogService } from '../../../../platform/log/common/logService';
import { IEndpointProvider } from '../../../../platform/endpoint/common/endpointProvider';
import * as http from 'http';
import { ChatFetchResponseType } from '../../../../platform/chat/common/commonTypes';
import { Raw } from '@vscode/prompt-tsx';

describe('LanguageModelServer', () => {
	let logService: ILogService;
	let endpointProvider: IEndpointProvider;
	let server: LanguageModelServer;

	beforeEach(() => {
		logService = {
			trace: vi.fn(),
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			critical: vi.fn(),
			flush: vi.fn(),
		} as any;

		endpointProvider = {
			getAllChatEndpoints: vi.fn().mockResolvedValue([]),
		} as any;

		server = new LanguageModelServer(logService, endpointProvider);
	});

	afterEach(() => {
		server.stop();
	});

	it('should initialize with a random nonce and zero port', () => {
		const config = server.getConfig();
		expect(config.port).toBe(0);
		expect(config.nonce).toMatch(/^vscode-lm-.+/);
	});

	it('should handle OPTIONS request', async () => {
		await server.start();
		const config = server.getConfig();
		const options = {
			hostname: '127.0.0.1',
			port: config.port,
			path: '/',
			method: 'OPTIONS',
		};

		const req = http.request(options);
		req.end();

		const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
			req.on('response', resolve);
			req.on('error', reject);
		});

		expect(res.statusCode).toBe(200);
	});

	it('should handle GET /', async () => {
		await server.start();
		const config = server.getConfig();
		const options = {
			hostname: '127.0.0.1',
			port: config.port,
			path: '/',
			method: 'GET',
		};

		const req = http.request(options);
		req.end();

		const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
			req.on('response', resolve);
			req.on('error', reject);
		});

		expect(res.statusCode).toBe(200);
		let body = '';
		res.on('data', chunk => { body += chunk; });
		await new Promise(resolve => res.on('end', resolve));
		expect(body).toBe('Hello from LanguageModelServer');
	});

	it('should handle GET /models', async () => {
		await server.start();
		const config = server.getConfig();
		const options = {
			hostname: '127.0.0.1',
			port: config.port,
			path: '/models',
			method: 'GET',
		};

		const req = http.request(options);
		req.end();

		const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
			req.on('response', resolve);
			req.on('error', reject);
		});

		expect(res.statusCode).toBe(200);
		expect(res.headers['content-type']).toBe('application/json');

		let body = '';
		res.on('data', chunk => { body += chunk; });
		await new Promise(resolve => res.on('end', resolve));
		expect(JSON.parse(body)).toEqual({ data: [] });
	});

	it('should return 404 for unknown endpoints', async () => {
		await server.start();
		const config = server.getConfig();
		const options = {
			hostname: '127.0.0.1',
			port: config.port,
			path: '/unknown',
			method: 'GET',
		};

		const req = http.request(options);
		req.end();

		const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
			req.on('response', resolve);
			req.on('error', reject);
		});

		expect(res.statusCode).toBe(404);
		expect(res.headers['content-type']).toBe('application/json');

		let body = '';
		res.on('data', chunk => { body += chunk; });
		await new Promise(resolve => res.on('end', resolve));
		expect(JSON.parse(body)).toEqual({ error: 'Not found' });
	});
});

describe('LanguageModelServer - POST requests', () => {
	let logService: ILogService;
	let endpointProvider: IEndpointProvider;
	let server: LanguageModelServer;

	beforeEach(() => {
		logService = {
			trace: vi.fn(),
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			critical: vi.fn(),
			flush: vi.fn(),
		} as any;

		endpointProvider = {
			getAllChatEndpoints: vi.fn().mockResolvedValue([]),
		} as any;

		server = new LanguageModelServer(logService, endpointProvider);
	});

	afterEach(() => {
		server.stop();
	});

	it('should reject requests with invalid auth key', async () => {
		await server.start();
		const config = server.getConfig();
		const options = {
			hostname: '127.0.0.1',
			port: config.port,
			path: '/v1/messages',
			method: 'POST',
			headers: {
				'x-api-key': 'invalid-key'
			}
		};

		const req = http.request(options);
		req.end();

		const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
			req.on('response', resolve);
			req.on('error', reject);
		});

		expect(res.statusCode).toBe(401);

		let body = '';
		res.on('data', chunk => { body += chunk; });
		await new Promise(resolve => res.on('end', resolve));
		expect(JSON.parse(body)).toEqual({ error: 'Invalid authentication' });
	});

	it('should return 404 if no language models available', async () => {
		await server.start();
		const config = server.getConfig();
		const options = {
			hostname: '127.0.0.1',
			port: config.port,
			path: '/v1/messages',
			method: 'POST',
			headers: {
				'x-api-key': config.nonce,
				'content-type': 'application/json'
			}
		};

		const req = http.request(options);
		req.write(JSON.stringify({
			model: 'claude-3-5-sonnet',
			messages: [{ role: 'user', content: 'hello' }]
		}));
		req.end();

		const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
			req.on('response', resolve);
			req.on('error', reject);
		});

		expect(res.statusCode).toBe(404);
		let body = '';
		res.on('data', chunk => { body += chunk; });
		await new Promise(resolve => res.on('end', resolve));
		expect(JSON.parse(body)).toEqual({ error: 'No language models available' });
	});
});

describe('LanguageModelServer - selectEndpoint', () => {
	let logService: ILogService;
	let endpointProvider: IEndpointProvider;
	let server: any;

	beforeEach(() => {
		logService = {
			trace: vi.fn(),
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			critical: vi.fn(),
			flush: vi.fn(),
		} as any;

		endpointProvider = {
			getAllChatEndpoints: vi.fn().mockResolvedValue([]),
		} as any;

		server = new LanguageModelServer(logService, endpointProvider);
	});

	afterEach(() => {
		server.stop();
	});

	it('should map claude models correctly', () => {
		const endpoints = [
			{ model: 'claude-haiku-4.5', family: 'claude' },
			{ model: 'claude-sonnet-4.5', family: 'claude' },
			{ model: 'claude-opus-4.5', family: 'claude' }
		];

		// test mapped model fallback
		expect(server.selectEndpoint(endpoints, 'claude-haiku')).toEqual(endpoints[0]);
		expect(server.selectEndpoint(endpoints, 'claude-sonnet-4')).toEqual(endpoints[1]);
		expect(server.selectEndpoint(endpoints, 'claude-opus-4')).toEqual(endpoints[2]);
	});

	it('should match exact model or family', () => {
		const endpoints = [
			{ model: 'gpt-4', family: 'gpt' },
			{ model: 'gpt-3.5', family: 'gpt' }
		];

		expect(server.selectEndpoint(endpoints, 'gpt-4')).toEqual(endpoints[0]);
		expect(server.selectEndpoint(endpoints, 'gpt-3.5')).toEqual(endpoints[1]);
		expect(server.selectEndpoint(endpoints, 'gpt')).toEqual(endpoints[0]);
	});

	it('should fallback to partial anthropic matches', () => {
		const endpoints1 = [{ model: 'claude-haiku-4-5-some-suffix', family: 'claude' }];
		expect(server.selectEndpoint(endpoints1, 'claude-haiku-4')).toEqual(endpoints1[0]);

		const endpoints2 = [{ model: 'claude-sonnet-4-5-some-suffix', family: 'claude' }];
		expect(server.selectEndpoint(endpoints2, 'claude-sonnet-4')).toEqual(endpoints2[0]);

		const endpoints3 = [{ model: 'claude-opus-4-5-some-suffix', family: 'claude' }];
		expect(server.selectEndpoint(endpoints3, 'claude-opus-4')).toEqual(endpoints3[0]);

		const endpoints4 = [{ model: 'claude-other', family: 'claude' }];
		expect(server.selectEndpoint(endpoints4, 'claude-haiku-4')).toEqual(endpoints4[0]);
	});

	it('should return first endpoint if no model specified', () => {
		const endpoints = [
			{ model: 'model1' },
			{ model: 'model2' }
		];
		expect(server.selectEndpoint(endpoints, undefined)).toEqual(endpoints[0]);
	});
});

describe('LanguageModelServer - POST requests (success/streaming)', () => {
	let logService: ILogService;
	let endpointProvider: IEndpointProvider;
	let server: LanguageModelServer;
	let mockEndpoint: any;

	beforeEach(() => {
		logService = {
			trace: vi.fn(),
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			critical: vi.fn(),
			flush: vi.fn(),
		} as any;

		mockEndpoint = {
			model: 'claude-3-5-sonnet',
			modelMaxPromptTokens: 1000,
			makeChatRequest2: vi.fn(),
		};

		endpointProvider = {
			getAllChatEndpoints: vi.fn().mockResolvedValue([mockEndpoint]),
		} as any;

		server = new LanguageModelServer(logService, endpointProvider);
	});

	afterEach(() => {
		server.stop();
	});

	it('should handle successful chat request and stream response', async () => {
		// Setup mock response
		mockEndpoint.makeChatRequest2.mockImplementation(async (req: any, token: any) => {
			await req.finishedCb('Hello', 0, { text: 'Hello' });
			return {
				type: ChatFetchResponseType.Success,
				usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
			};
		});

		await server.start();
		const config = server.getConfig();
		const options = {
			hostname: '127.0.0.1',
			port: config.port,
			path: '/v1/messages',
			method: 'POST',
			headers: {
				'x-api-key': config.nonce,
				'content-type': 'application/json'
			}
		};

		const req = http.request(options);
		req.write(JSON.stringify({
			model: 'claude-3-5-sonnet',
			messages: [{ role: 'user', content: 'hello' }]
		}));
		req.end();

		const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
			req.on('response', resolve);
			req.on('error', reject);
		});

		expect(res.statusCode).toBe(200);
		expect(res.headers['content-type']).toBe('text/event-stream');

		let body = '';
		res.on('data', chunk => { body += chunk; });
		await new Promise(resolve => res.on('end', resolve));

		// It should contain events formatted by AnthropicAdapter
		expect(body).toContain('event: message_start');
		expect(body).toContain('event: content_block_delta');
		expect(body).toContain('Hello');
		expect(body).toContain('event: message_stop');
		expect(body).toContain('usage');
	});

	it('should return 404 if no matching model found', async () => {
		await server.start();
		const config = server.getConfig();
		const options = {
			hostname: '127.0.0.1',
			port: config.port,
			path: '/v1/messages',
			method: 'POST',
			headers: {
				'x-api-key': config.nonce,
				'content-type': 'application/json'
			}
		};

		const req = http.request(options);
		req.write(JSON.stringify({
			model: 'unsupported-model-that-does-not-exist',
			messages: [{ role: 'user', content: 'hello' }]
		}));
		req.end();

		const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
			req.on('response', resolve);
			req.on('error', reject);
		});

		expect(res.statusCode).toBe(404);
		let body = '';
		res.on('data', chunk => { body += chunk; });
		await new Promise(resolve => res.on('end', resolve));
		expect(JSON.parse(body)).toEqual({ error: 'No model found matching criteria' });
	});

	it('should stream tool calls', async () => {
		// Setup mock response
		mockEndpoint.makeChatRequest2.mockImplementation(async (req: any, token: any) => {
			await req.finishedCb('', 0, {
				copilotToolCalls: [{
					id: 'call_123',
					name: 'get_weather',
					arguments: '{"location":"Seattle"}'
				}]
			});
			return {
				type: ChatFetchResponseType.Success
			};
		});

		await server.start();
		const config = server.getConfig();
		const options = {
			hostname: '127.0.0.1',
			port: config.port,
			path: '/v1/messages',
			method: 'POST',
			headers: {
				'x-api-key': config.nonce,
				'content-type': 'application/json'
			}
		};

		const req = http.request(options);
		req.write(JSON.stringify({
			model: 'claude-3-5-sonnet',
			messages: [{ role: 'user', content: 'what is the weather' }]
		}));
		req.end();

		const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
			req.on('response', resolve);
			req.on('error', reject);
		});

		expect(res.statusCode).toBe(200);
		let body = '';
		res.on('data', chunk => { body += chunk; });
		await new Promise(resolve => res.on('end', resolve));

		expect(body).toContain('get_weather');
		expect(body).toContain('Seattle');
		expect(body).toContain('tool_use');
	});
});

describe('LanguageModelServer - Edge Cases', () => {
	let logService: ILogService;
	let endpointProvider: IEndpointProvider;
	let server: LanguageModelServer;
	let mockEndpoint: any;

	beforeEach(() => {
		logService = {
			trace: vi.fn(),
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			critical: vi.fn(),
			flush: vi.fn(),
		} as any;

		mockEndpoint = {
			model: 'claude-3-5-sonnet',
			modelMaxPromptTokens: 1000,
			makeChatRequest2: vi.fn(),
		};

		endpointProvider = {
			getAllChatEndpoints: vi.fn().mockResolvedValue([mockEndpoint]),
		} as any;

		server = new LanguageModelServer(logService, endpointProvider);
	});

	afterEach(() => {
		server.stop();
	});

	it('should handle request cancellation when client disconnects', async () => {
		let resolveChatReq: any;
		const chatPromise = new Promise(resolve => { resolveChatReq = resolve; });

		mockEndpoint.makeChatRequest2.mockImplementation(async (req: any, token: any) => {
			await chatPromise;
			return {
				type: ChatFetchResponseType.Success
			};
		});

		await server.start();
		const config = server.getConfig();
		const options = {
			hostname: '127.0.0.1',
			port: config.port,
			path: '/v1/messages',
			method: 'POST',
			headers: {
				'x-api-key': config.nonce,
				'content-type': 'application/json'
			}
		};

		const req = http.request(options);
		req.write(JSON.stringify({
			model: 'claude-3-5-sonnet',
			messages: [{ role: 'user', content: 'hello' }]
		}));

		req.on('response', (res) => {
			res.destroy();
		});

		req.end();

		await new Promise(resolve => setTimeout(resolve, 50));
		resolveChatReq();
		await new Promise(resolve => setTimeout(resolve, 50));

		expect(logService.info).toHaveBeenCalledWith(expect.stringContaining('Client disconnected before request complete'));
	});
});

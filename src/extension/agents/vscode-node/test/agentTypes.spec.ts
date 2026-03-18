import { describe, expect, it } from 'vitest';
import { AgentConfig, buildAgentMarkdown } from '../agentTypes';

describe('buildAgentMarkdown', () => {
	it('should serialize basic scalar fields', () => {
		const config: AgentConfig = {
			name: 'Test Agent',
			description: 'A simple test agent',
			argumentHint: 'Provide an argument',
			tools: [],
			body: 'Here is the agent instructions.'
		};

		const result = buildAgentMarkdown(config);
		expect(result).toBe(`---
name: Test Agent
description: A simple test agent
argument-hint: Provide an argument
---
Here is the agent instructions.`);
	});

	it('should serialize string model', () => {
		const config: AgentConfig = {
			name: 'Test',
			description: 'Test',
			argumentHint: 'Test',
			tools: [],
			model: 'gpt-4',
			body: 'body'
		};

		const result = buildAgentMarkdown(config);
		expect(result).toContain('model: gpt-4');
	});

	it('should serialize array of models with single quote escaping', () => {
		const config: AgentConfig = {
			name: 'Test',
			description: 'Test',
			argumentHint: 'Test',
			tools: [],
			model: ["gpt-4", "custom'model"],
			body: 'body'
		};

		const result = buildAgentMarkdown(config);
		expect(result).toContain("model: ['gpt-4', 'custom''model']");
	});

	it('should serialize target, disableModelInvocation, and userInvocable', () => {
		const config: AgentConfig = {
			name: 'Test',
			description: 'Test',
			argumentHint: 'Test',
			tools: [],
			target: 'node',
			disableModelInvocation: true,
			userInvocable: false,
			body: 'body'
		};

		const result = buildAgentMarkdown(config);
		expect(result).toContain('target: node');
		expect(result).toContain('disable-model-invocation: true');
		expect(result).toContain('user-invocable: false');
	});

	it('should serialize tools with single quote escaping', () => {
		const config: AgentConfig = {
			name: 'Test',
			description: 'Test',
			argumentHint: 'Test',
			tools: ['search', "read'file"],
			body: 'body'
		};

		const result = buildAgentMarkdown(config);
		expect(result).toContain("tools: ['search', 'read''file']");
	});

	it('should serialize agents with single quote escaping', () => {
		const config: AgentConfig = {
			name: 'Test',
			description: 'Test',
			argumentHint: 'Test',
			tools: [],
			agents: ['agent1', "agent'2"],
			body: 'body'
		};

		const result = buildAgentMarkdown(config);
		expect(result).toContain("agents: ['agent1', 'agent''2']");
	});

	it('should serialize handoffs formatting and single quote escaping in prompts', () => {
		const config: AgentConfig = {
			name: 'Test',
			description: 'Test',
			argumentHint: 'Test',
			tools: [],
			handoffs: [
				{
					label: 'Switch to Ask',
					agent: 'ask',
					prompt: "Here is a prompt with a 'quote'",
					send: true,
					showContinueOn: false,
					model: 'gpt-4'
				},
				{
					label: 'Switch to Plan',
					agent: 'plan',
					prompt: 'No quote'
				}
			],
			body: 'body'
		};

		const result = buildAgentMarkdown(config);
		expect(result).toContain('handoffs:');
		expect(result).toContain('  - label: Switch to Ask');
		expect(result).toContain('    agent: ask');
		expect(result).toContain("    prompt: 'Here is a prompt with a ''quote'''");
		expect(result).toContain('    send: true');
		expect(result).toContain('    showContinueOn: false');
		expect(result).toContain('    model: gpt-4');

		expect(result).toContain('  - label: Switch to Plan');
		expect(result).toContain('    agent: plan');
		expect(result).toContain("    prompt: 'No quote'");
	});
});

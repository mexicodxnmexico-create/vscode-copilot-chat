// @vitest-environment jsdom
import { vi, describe, it, beforeEach, expect, afterEach } from 'vitest';

describe('suggestionsPanelWebview', () => {
    let container: HTMLElement;
    let loadingContainer: HTMLElement;
    let progressBar: HTMLProgressElement;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="solutionsContainer" aria-busy="true"></div>
            <div id="loadingContainer">
                <label>Loading...</label>
                <progress id="progress-bar" value="0" max="100"></progress>
            </div>
        `;
        container = document.getElementById('solutionsContainer')!;
        loadingContainer = document.getElementById('loadingContainer')!;
        progressBar = document.getElementById('progress-bar') as HTMLProgressElement;

        // Mock VS Code API
        (global as any).acquireVsCodeApi = vi.fn().mockReturnValue({
            postMessage: vi.fn(),
            setState: vi.fn(),
            getState: vi.fn()
        });

        // Mock Webview UI Toolkit
        vi.mock('@vscode/webview-ui-toolkit', () => ({
            provideVSCodeDesignSystem: () => ({ register: vi.fn() }),
            vsCodeButton: vi.fn()
        }));

        // Mock DOMPurify
        vi.mock('dompurify', () => ({
            default: {
                sanitize: (str: string) => str
            }
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
        vi.resetModules();
    });

    it('should set aria-busy to false when loading is complete', async () => {
        // Import the module to execute top-level code and add event listeners
        await import('./suggestionsPanelWebview');

        // Simulate message
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                command: 'solutionsUpdated',
                solutions: [],
                percentage: 100
            }
        }));

        expect(container.getAttribute('aria-busy')).toBe('false');
    });
});

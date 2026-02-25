import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { NuGetMcpSetup } from './nuget';

// Mock vscode module
vi.mock('vscode', () => ({
    l10n: {
        t: (key: string, ...args: any[]) => key
    }
}));

// Mock LogService
const mockLogService = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
    debug: vi.fn(),
    getLevel: vi.fn(),
    setLevel: vi.fn(),
    onDidChangeLogLevel: vi.fn(),
};

// Mock FetcherService
const mockFetcherService = {
    fetch: vi.fn(),
};

describe('NuGetMcpSetup', () => {
    let nuGetMcpSetup: any;

    beforeEach(() => {
        vi.clearAllMocks();
        nuGetMcpSetup = new NuGetMcpSetup(mockLogService as any, mockFetcherService as any);
    });

    it('should prevent path traversal in readServerManifest', async () => {
        const packagesDir = path.resolve('/tmp/packages');
        const maliciousId = '../../etc';
        const version = 'passwd';

        // This resolves to something outside packagesDir
        const maliciousPath = path.join(packagesDir, maliciousId.toLowerCase(), version.toLowerCase(), '.mcp', 'server.json');

        vi.spyOn(fs, 'access').mockImplementation(async (p) => {
            if (path.resolve(p as string) === path.resolve(maliciousPath)) return undefined;
            throw new Error('File not found');
        });

        vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify({ name: 'malicious' }));

        const result = await nuGetMcpSetup.readServerManifest(packagesDir, maliciousId, version);

        // Expect undefined because it should be blocked
        expect(result).toBeUndefined();

        // Verify warning was logged
        expect(mockLogService.warn).toHaveBeenCalledWith(expect.stringContaining('Potential path traversal attempt detected'));
    });

    it('should allow valid paths in readServerManifest', async () => {
        const packagesDir = path.resolve('/tmp/packages');
        const id = 'valid-package';
        const version = '1.0.0';

        const validPath = path.join(packagesDir, id.toLowerCase(), version.toLowerCase(), '.mcp', 'server.json');

        vi.spyOn(fs, 'access').mockImplementation(async (p) => {
            if (path.resolve(p as string) === path.resolve(validPath)) return undefined;
            throw new Error('File not found');
        });

        vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify({ name: 'valid-package' }));

        const result = await nuGetMcpSetup.readServerManifest(packagesDir, id, version);

        expect(result).toBeDefined();
        // Cast to any because the return type annotation in nuget.ts might be incorrect (Promise<string | undefined>)
        // while it actually returns an object.
        expect((result as any).name).toBe('valid-package');
    });
});

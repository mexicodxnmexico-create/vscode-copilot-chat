
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DeferredPromise, IntervalTimer } from '../../../../util/vs/base/common/async';
import { CancellationToken } from '../../../../util/vs/base/common/cancellation';
import { Emitter } from '../../../../util/vs/base/common/event';
import { Result } from '../../../../util/common/result';
import {
    BaseRemoteCodeSearchRepo,
    CodeSearchRepoStatus,
    RemoteCodeSearchState,
    BuildIndexTriggerReason,
    TriggerIndexingError
} from '../../node/codeSearch/codeSearchRepo';
import { RepoInfo } from '../../node/codeSearch/repoTracker';
import { ResolvedRepoRemoteInfo } from '../../../git/common/gitService';
import { ILogService } from '../../../log/common/logService';
import { ITelemetryService } from '../../../telemetry/common/telemetry';
import { EmbeddingType } from '../../../embeddings/common/embeddingsComputer';
import { WorkspaceChunkSearchOptions } from '../../common/workspaceChunkSearch';
import { TelemetryCorrelationId } from '../../../../util/common/telemetryCorrelationId';
import { CodeSearchResult, RemoteCodeSearchIndexState, RemoteCodeSearchError, RemoteCodeSearchIndexStatus } from '../../../remoteCodeSearch/common/remoteCodeSearch';

// Mock dependencies
const mockLogService = {
    trace: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
} as unknown as ILogService;

const mockTelemetryService = {
    sendMSFTTelemetryEvent: vi.fn(),
} as unknown as ITelemetryService;

// Concrete implementation of abstract class for testing
class TestRemoteCodeSearchRepo extends BaseRemoteCodeSearchRepo {
    public fetchRemoteIndexStateMock = vi.fn<[CancellationToken], Promise<Result<RemoteCodeSearchIndexState, RemoteCodeSearchError>>>();

    constructor() {
        super(
            { rootUri: { toString: () => 'file:///test/repo' } } as RepoInfo,
            { repoId: 'test-repo' } as unknown as ResolvedRepoRemoteInfo,
            mockLogService,
            mockTelemetryService
        );
    }

    public override async prepareSearch(telemetryInfo: TelemetryCorrelationId, token: CancellationToken): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    public override async searchRepo(authOptions: { silent: boolean }, embeddingType: EmbeddingType, resolvedQuery: string, maxResultCountHint: number, options: WorkspaceChunkSearchOptions, telemetryInfo: TelemetryCorrelationId, token: CancellationToken): Promise<CodeSearchResult> {
        throw new Error('Method not implemented.');
    }

    public override async triggerRemoteIndexingOfRepo(triggerReason: BuildIndexTriggerReason, telemetryInfo: TelemetryCorrelationId): Promise<Result<true, TriggerIndexingError>> {
        throw new Error('Method not implemented.');
    }

    // Expose protected method for mocking
    protected override async doFetchRemoteIndexState(token: CancellationToken): Promise<Result<RemoteCodeSearchIndexState, RemoteCodeSearchError>> {
        return this.fetchRemoteIndexStateMock(token);
    }

    // Helper to start polling
    public startPolling() {
        this.updateState({ status: CodeSearchRepoStatus.BuildingIndex });
        // @ts-ignore - Accessing private method
        return this.pollForRepoIndexingToComplete();
    }
}

describe('BaseRemoteCodeSearchRepo', () => {
    let repo: TestRemoteCodeSearchRepo;

    beforeEach(() => {
        vi.useFakeTimers();
        repo = new TestRemoteCodeSearchRepo();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        repo.dispose();
    });

    test('should poll with exponential backoff', async () => {
        // Setup initial state: BuildingIndex
        // The first call to doFetchRemoteIndexState happens in constructor (initTask), we can mock it
        repo.fetchRemoteIndexStateMock.mockResolvedValue(Result.ok({ status: RemoteCodeSearchIndexStatus.BuildingIndex }));

        // Wait for init
        const initPromise = repo.initialize();
        await vi.advanceTimersByTimeAsync(1); // Advance past timeout(0)
        await initPromise;

        // Now trigger polling
        const pollingPromise = repo.startPolling();

        // Initial check immediately? No, IntervalTimer usually waits for interval first.
        // Let's verify calls.
        // The constructor calls refreshStatusFromEndpoint once.
        expect(repo.fetchRemoteIndexStateMock).toHaveBeenCalledTimes(1);
        repo.fetchRemoteIndexStateMock.mockClear();

        // 1st poll attempt - after 3000ms
        await vi.advanceTimersByTimeAsync(3000);
        expect(repo.fetchRemoteIndexStateMock).toHaveBeenCalledTimes(1);

        // 2nd poll attempt - after 3000 * 1.5 = 4500ms
        await vi.advanceTimersByTimeAsync(4500);
        expect(repo.fetchRemoteIndexStateMock).toHaveBeenCalledTimes(2);

        // 3rd poll attempt - after 4500 * 1.5 = 6750ms
        await vi.advanceTimersByTimeAsync(6750);
        expect(repo.fetchRemoteIndexStateMock).toHaveBeenCalledTimes(3);

        // Resolve status to Ready to stop polling
        repo.fetchRemoteIndexStateMock.mockResolvedValue(Result.ok({ status: RemoteCodeSearchIndexStatus.Ready, indexedCommit: 'abc' }));

        // 4th poll attempt - after 6750 * 1.5 = 10125ms
        await vi.advanceTimersByTimeAsync(10125);
        expect(repo.fetchRemoteIndexStateMock).toHaveBeenCalledTimes(4);

        await pollingPromise;
        expect(repo.status).toBe(CodeSearchRepoStatus.Ready);
    });

    test('should respect max interval', async () => {
         repo.fetchRemoteIndexStateMock.mockResolvedValue(Result.ok({ status: RemoteCodeSearchIndexStatus.BuildingIndex }));

         const initPromise = repo.initialize();
         await vi.advanceTimersByTimeAsync(1); // Advance past timeout(0)
         await initPromise;

         repo.startPolling();
         repo.fetchRemoteIndexStateMock.mockClear();

         // Simulate enough advancements to reach max interval (60s)
         // 3, 4.5, 6.75, 10.125, 15.187, 22.78, 34.17, 51.25, 60, 60...

         let currentDelay = 3000;
         // Advance until we reach max interval
         for (let i = 0; i < 10; i++) {
             await vi.advanceTimersByTimeAsync(currentDelay);
             currentDelay = currentDelay * 1.5;
             if (currentDelay > 60000) currentDelay = 60000;
         }

         // Verify that we are polling at 60s intervals now
         repo.fetchRemoteIndexStateMock.mockClear();
         await vi.advanceTimersByTimeAsync(60000);
         expect(repo.fetchRemoteIndexStateMock).toHaveBeenCalledTimes(1);

         repo.fetchRemoteIndexStateMock.mockClear();
         await vi.advanceTimersByTimeAsync(60000);
         expect(repo.fetchRemoteIndexStateMock).toHaveBeenCalledTimes(1);
    });

    test('should stop polling after max attempts/timeout', async () => {
         // This depends on whether we implement max attempts or timeout.
         // Assuming we switch to a timeout or keep max attempts but adjusted.
         // For now, let's verify the current behavior (or intended behavior)
         // If plan is to use timeout ~10 mins.

         repo.fetchRemoteIndexStateMock.mockResolvedValue(Result.ok({ status: RemoteCodeSearchIndexStatus.BuildingIndex }));

         const initPromise = repo.initialize();
         await vi.advanceTimersByTimeAsync(1); // Advance past timeout(0)
         await initPromise;

         const pollingPromise = repo.startPolling();

         // Fast forward 15 minutes
         await vi.advanceTimersByTimeAsync(15 * 60 * 1000);

         await pollingPromise;
         expect(repo.status).toBe(CodeSearchRepoStatus.CouldNotCheckIndexStatus);
    });
});

const { performance } = require('perf_hooks');

const mockClaudeCodeModels = {
    async mapSdkModelToEndpointModel(id) {
        return new Promise(resolve => setTimeout(() => resolve(id + "-endpoint"), 50));
    }
};

function collectSdkModelIds() {
    return new Set(['model1', 'model2', 'model3', 'model4', 'model5']);
}

async function sequential(session) {
    const sdkModelIds = collectSdkModelIds(session);
    const map = new Map();
    for (const sdkModelId of sdkModelIds) {
        const endpointModelId = await mockClaudeCodeModels.mapSdkModelToEndpointModel(sdkModelId);
        if (endpointModelId) {
            map.set(sdkModelId, endpointModelId);
        }
    }
    return map;
}

async function concurrent(session) {
    const sdkModelIds = collectSdkModelIds(session);
    const map = new Map();
    await Promise.all(Array.from(sdkModelIds).map(async (sdkModelId) => {
        const endpointModelId = await mockClaudeCodeModels.mapSdkModelToEndpointModel(sdkModelId);
        if (endpointModelId) {
            map.set(sdkModelId, endpointModelId);
        }
    }));
    return map;
}

async function measure() {
    const start1 = performance.now();
    await sequential({});
    const end1 = performance.now();
    console.log(`Sequential: ${end1 - start1}ms`);

    const start2 = performance.now();
    await concurrent({});
    const end2 = performance.now();
    console.log(`Concurrent: ${end2 - start2}ms`);
}

measure();

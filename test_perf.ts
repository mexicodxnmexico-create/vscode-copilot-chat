import { performance } from 'perf_hooks';

async function testSequential() {
    const sdkModelIds = new Set(['model1', 'model2', 'model3', 'model4', 'model5', 'model6', 'model7', 'model8']);

    // mock mapSdkModelToEndpointModel delay
    const mapSdkModelToEndpointModel = async (id: string) => {
        await new Promise(r => setTimeout(r, 10)); // 10ms per model mapping
        return `mapped_${id}`;
    };

    const start = performance.now();
    const map = new Map<string, string>();
    for (const sdkModelId of sdkModelIds) {
        const endpointModelId = await mapSdkModelToEndpointModel(sdkModelId);
        if (endpointModelId) {
            map.set(sdkModelId, endpointModelId);
        }
    }
    const end = performance.now();
    console.log(`Sequential: ${end - start}ms`);
}

async function testParallel() {
    const sdkModelIds = new Set(['model1', 'model2', 'model3', 'model4', 'model5', 'model6', 'model7', 'model8']);

    // mock mapSdkModelToEndpointModel delay
    const mapSdkModelToEndpointModel = async (id: string) => {
        await new Promise(r => setTimeout(r, 10)); // 10ms per model mapping
        return `mapped_${id}`;
    };

    const start = performance.now();
    const map = new Map<string, string>();

    await Promise.all(
        Array.from(sdkModelIds).map(async (sdkModelId) => {
            const endpointModelId = await mapSdkModelToEndpointModel(sdkModelId);
            if (endpointModelId) {
                map.set(sdkModelId, endpointModelId);
            }
        })
    );

    const end = performance.now();
    console.log(`Parallel: ${end - start}ms`);
}

async function run() {
    await testSequential();
    await testParallel();
}

run();

import { performance } from 'perf_hooks';

// Simulate ClaudeCodeModels mapping
class MockClaudeCodeModels {
  async mapSdkModelToEndpointModel(sdkModelId) {
    // Simulate I/O latency (e.g. API call, file read)
    return new Promise(resolve => setTimeout(() => resolve(`endpoint-${sdkModelId}`), 50));
  }
}

async function runBenchmark() {
  const models = new MockClaudeCodeModels();
  // Simulate 10 unique models collected from a session
  const sdkModelIds = Array.from({ length: 10 }, (_, i) => `model-${i}`);

  console.log('Running sequential implementation...');
  const startSeq = performance.now();
  const mapSeq = new Map();
  for (const sdkModelId of sdkModelIds) {
    const endpointModelId = await models.mapSdkModelToEndpointModel(sdkModelId);
    if (endpointModelId) {
      mapSeq.set(sdkModelId, endpointModelId);
    }
  }
  const endSeq = performance.now();
  console.log(`Sequential took: ${(endSeq - startSeq).toFixed(2)}ms`);

  console.log('Running parallel implementation...');
  const startPar = performance.now();
  const mapPar = new Map();
  await Promise.all(
    Array.from(sdkModelIds).map(async (sdkModelId) => {
      const endpointModelId = await models.mapSdkModelToEndpointModel(sdkModelId);
      if (endpointModelId) {
        mapPar.set(sdkModelId, endpointModelId);
      }
    })
  );
  const endPar = performance.now();
  console.log(`Parallel took: ${(endPar - startPar).toFixed(2)}ms`);
}

runBenchmark().catch(console.error);

import { performance } from 'perf_hooks';

// Mocks
const mockFileSystemService = {
  readFile: async (uri) => {
    // Simulate I/O delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return new TextEncoder().encode(JSON.stringify({
      hooks: {
        PreToolUse: [
          { matcher: "Bash", hooks: [{ command: "echo 1" }] },
          { matcher: "Edit", hooks: [{ command: "echo 2" }] }
        ]
      }
    }));
  }
};

const mockWorkspaceService = {
  getWorkspaceFolders: () => [{ fsPath: '/workspace1' }, { fsPath: '/workspace2' }],
  getWorkspaceFolderName: (uri) => uri.fsPath.split('/').pop()
};

const mockEnvService = {
  userHome: { fsPath: '/home/user' }
};

class URI {
  constructor(fsPath) { this.fsPath = fsPath; }
  static joinPath(base, ...paths) {
    if (typeof base === 'string') return new URI(base + '/' + paths.join('/'));
    return new URI(base.fsPath + '/' + paths.join('/'));
  }
}

// Emulate _getAllSettingsLocations
function _getAllSettingsLocations() {
  const locations = [];
  const workspaceFolders = mockWorkspaceService.getWorkspaceFolders();

  for (const folderUri of workspaceFolders) {
    const folderName = mockWorkspaceService.getWorkspaceFolderName(folderUri);
    locations.push({
      type: 'local',
      label: 'Workspace (local) - ' + folderName,
      workspaceFolder: folderUri,
      settingsPath: URI.joinPath(folderUri, '.claude', 'settings.local.json'),
    });
    locations.push({
      type: 'shared',
      label: 'Workspace - ' + folderName,
      workspaceFolder: folderUri,
      settingsPath: URI.joinPath(folderUri, '.claude', 'settings.json'),
    });
  }

  locations.push({
    type: 'user',
    label: 'User',
    settingsPath: URI.joinPath(mockEnvService.userHome, '.claude', 'settings.json'),
  });

  return locations;
}

async function _loadSettings(settingsPath) {
  try {
    const content = await mockFileSystemService.readFile(settingsPath);
    return JSON.parse(new TextDecoder().decode(content));
  } catch {
    return {};
  }
}

async function sequential(event) {
  const matchers = [];
  const allLocations = _getAllSettingsLocations();

  for (const location of allLocations) {
    try {
      const settings = await _loadSettings(location.settingsPath);
      if (settings.hooks?.[event]) {
        for (const matcherConfig of settings.hooks[event]) {
          const existing = matchers.find(m => m.matcher === matcherConfig.matcher);
          if (!existing) {
            matchers.push({
              matcher: matcherConfig.matcher,
              location,
            });
          }
        }
      }
    } catch {
    }
  }
  return matchers;
}

async function parallel(event) {
  const matchers = [];
  const allLocations = _getAllSettingsLocations();

  const results = await Promise.all(
    allLocations.map(async (location) => {
      try {
        const settings = await _loadSettings(location.settingsPath);
        return { location, settings };
      } catch {
        return { location, settings: {} };
      }
    })
  );

  for (const { location, settings } of results) {
    if (settings.hooks?.[event]) {
      for (const matcherConfig of settings.hooks[event]) {
        const existing = matchers.find(m => m.matcher === matcherConfig.matcher);
        if (!existing) {
          matchers.push({
            matcher: matcherConfig.matcher,
            location,
          });
        }
      }
    }
  }

  return matchers;
}

async function run() {
  console.log("Warming up...");
  await sequential('PreToolUse');
  await parallel('PreToolUse');

  console.log("Running Sequential...");
  const startSeq = performance.now();
  await sequential('PreToolUse');
  const endSeq = performance.now();
  console.log(`Sequential: ${(endSeq - startSeq).toFixed(2)} ms`);

  console.log("Running Parallel...");
  const startPar = performance.now();
  await parallel('PreToolUse');
  const endPar = performance.now();
  console.log(`Parallel: ${(endPar - startPar).toFixed(2)} ms`);
}

run();

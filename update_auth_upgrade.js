const fs = require('fs');
const path = 'src/platform/authentication/common/authenticationUpgradeService.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Update confirmation data shape
code = code.replace(
  /{ authPermissionPrompted: true, \.\.\.data, context },/g,
  "{ authPermissionPrompted: true, request: data, context },"
);

// 2. Update type and extraction of findConfirmationRequested
code = code.replace(
  /const findConfirmationRequested: ChatRequest \| undefined = request\.acceptedConfirmationData\?\.find\(ref => ref\?\.authPermissionPrompted\);/g,
  "const findConfirmationRequested: { request: ChatRequest } | undefined = request.acceptedConfirmationData?.find(ref => ref?.authPermissionPrompted);"
);

// 3. Update usage of findConfirmationRequested properties (only for prompt, command, isParticipantDetected)
code = code.replace(
  /isParticipantDetected: findConfirmationRequested\.isParticipantDetected,/g,
  "isParticipantDetected: findConfirmationRequested.request.isParticipantDetected,"
);
code = code.replace(
  /prompt: findConfirmationRequested\.prompt,/g,
  "prompt: findConfirmationRequested.request.prompt,"
);
code = code.replace(
  /command: findConfirmationRequested\.command,/g,
  "command: findConfirmationRequested.request.command,"
);

fs.writeFileSync(path, code);

import re

with open('src/extension/chatSessions/vscode-node/chatHistoryBuilder.ts', 'r') as f:
    content = f.read()

# Replace the block exactly by splitting and rejoining
lines = content.split('\n')
new_lines = []
skip = False
for line in lines:
    if line.strip() == "/**":
        # Lookahead to check if it's the right jsdoc
        idx = lines.index(line)
        if "Strips <system-reminder> tags" in lines[idx+1]:
            skip = True
    if not skip:
        new_lines.append(line)
    if skip and line.strip() == "}":
        skip = False

with open('src/extension/chatSessions/vscode-node/chatHistoryBuilder.ts', 'w') as f:
    f.write('\n'.join(new_lines))

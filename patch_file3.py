with open('src/extension/chatSessions/vscode-node/chatHistoryBuilder.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.strip() == "/**" and i + 1 < len(lines) and "Strips <system-reminder> tags" in lines[i+1]:
        skip = True
    if not skip:
        new_lines.append(line)
    if skip and line.startswith("}") and i - 1 > 0 and "return text.replace(" in lines[i-1]:
        skip = False

with open('src/extension/chatSessions/vscode-node/chatHistoryBuilder.ts', 'w') as f:
    f.writelines(new_lines)

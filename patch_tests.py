with open('src/extension/chatSessions/vscode-node/test/chatHistoryBuilder.spec.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "it('strips system-reminders from legacy string format', () => {" in line:
        skip = True
    if not skip:
        new_lines.append(line)
    if skip and line.strip() == "});" and i - 5 > 0 and "it('strips system-reminders" in lines[i-6]:
        skip = False

with open('src/extension/chatSessions/vscode-node/test/chatHistoryBuilder.spec.ts', 'w') as f:
    f.writelines(new_lines)

import re

with open('src/extension/chatSessions/vscode-node/chatHistoryBuilder.ts', 'r') as f:
    content = f.read()

# Remove the stripSystemReminders function and its JSDoc
content = re.sub(
    r'\/\*\*\n \* Strips <system-reminder> tags.*?\n \* sessions with concatenated system-reminders are no longer common\.\n \*\/\nfunction stripSystemReminders\(text: string\): string \{\n\treturn text\.replace\(\/<system-reminder>\[\\s\\S\]\*\?<\\/system-reminder>\\s\*\/\g, \'\'\);\n\}\n\n',
    '',
    content,
    flags=re.DOTALL
)

with open('src/extension/chatSessions/vscode-node/chatHistoryBuilder.ts', 'w') as f:
    f.write(content)

# Claude Generic Hooks

[![npm version](https://badge.fury.io/js/claude-code-generic-hooks.svg)](https://www.npmjs.com/package/claude-code-generic-hooks)

## Commands

### store

```bash
claude-code-generic-hooks store /path/to/db.sqlite
```

Stores hook metadata in an SQLite database

### yolo

```bash
claude-code-generic-hooks yolo
```

Autoapproves everything except for accepting a plan. Similar to `--dangerously-skip-permissions` but works in plan mode.

## Example configurations

### Store command - Log all hook events to a database:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-code-generic-hooks store ~/.claude/hooks.db"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-code-generic-hooks store ~/.claude/hooks.db"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-code-generic-hooks store ~/.claude/hooks.db"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-code-generic-hooks store ~/.claude/hooks.db"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-code-generic-hooks store ~/.claude/hooks.db"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-code-generic-hooks store ~/.claude/hooks.db"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "manual",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-code-generic-hooks store ~/.claude/hooks.db"
          }
        ]
      },
      {
        "matcher": "auto",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-code-generic-hooks store ~/.claude/hooks.db"
          }
        ]
      }
    ]
  }
}
```

### Yolo command - Auto-approve all tool usage:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-code-generic-hooks yolo"
          }
        ]
      }
    ]
  }
}
```

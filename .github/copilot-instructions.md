# Copilot Instructions

You are working in the ADR plugin repository for Claude Code.

## Project Overview

This is a Claude Code plugin for complete lifecycle management of Architectural Decision Records (ADRs).

## Key Components

- **Skills**: 12 skills covering fundamentals, formats, compliance, and integration
- **Commands**: 7 commands for ADR lifecycle management
- **Agents**: 3 agents for authoring, compliance, and research
- **Templates**: 7 ADR format templates

## Plugin Structure

```
.claude-plugin/plugin.json  # Plugin manifest
skills/                     # 12 skill directories with SKILL.md and references
commands/                   # 7 ADR commands
agents/                     # 3 ADR agents
templates/                  # ADR format templates
schemas/                    # Export schemas
```

## Development Guidelines

1. Follow Claude Code plugin standards
2. Keep changes focused and reviewable
3. Update CHANGELOG.md for user-facing changes
4. Test commands and agent triggering locally

## Testing

```bash
claude --plugin-dir .
```

Then test:
- `/adr:new` command
- `/adr:list` command
- `/adr:setup` command
- Agent triggering for architectural discussions

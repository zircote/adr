# ADR Plugin

Complete lifecycle management for Architectural Decision Records (ADRs): create, update, supersede, search, audit compliance, and export.

## Features

- **Multi-Format Support** - MADR, Structured MADR, Nygard, Y-Statement, Alexandrian, Business Case, Tyree-Akerman
- **Full Lifecycle Management** - Create, update, supersede, deprecate, archive
- **Compliance Auditing** - Proactive checks of code against accepted ADRs
- **Research Assistant** - Codebase analysis and web research for decision context
- **Proactive ADR Detection** - Agent suggests capturing architectural discussions
- **Git Integration** - Track changes, auto-commit, blame history
- **Export Options** - HTML, JSON, PDF for documentation and sharing
- **Configurable Workflow** - Custom statuses, numbering, templates
- **Multi-Directory Support** - Project-level and module-level ADRs
- **ADR Linking** - Supersedes, relates-to, amends relationships

## Installation

### From GitHub

```bash
claude plugin install zircote/adr
```

### Manual Installation

Clone and add to Claude Code:

```bash
git clone https://github.com/zircote/adr.git
claude --plugin-dir /path/to/adr
```

Or copy to your project's `.claude-plugin/` directory.

## Quick Start

```bash
# Initialize ADR configuration
/adr:setup

# Create your first ADR
/adr:new "Use PostgreSQL for Primary Storage"

# List all ADRs
/adr:list

# Search ADRs
/adr:search "database"
```

## Components

### Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/adr:new` | `<title>` | Create a new ADR with specified title |
| `/adr:list` | `[--status=<status>] [--format=table\|json\|brief]` | List all ADRs with optional filtering |
| `/adr:update` | `<id> [--status=<status>]` | Update an existing ADR (status, content) |
| `/adr:supersede` | `<existing-id> <new-title>` | Create ADR that supersedes an existing one |
| `/adr:search` | `<query> [--status=<status>] [--since=<date>]` | Search ADRs by content, status, or date |
| `/adr:setup` | (interactive) | Interactive configuration wizard |
| `/adr:export` | `[--format=html\|json\|pdf] [--output=<path>]` | Export ADRs to various formats |

### Agents

| Agent | Description |
|-------|-------------|
| `adr-author` | Proactively detects architectural discussions and suggests creating ADRs |
| `adr-compliance` | Audits code changes against accepted ADRs for violations |
| `adr-researcher` | Gathers context from codebase and web for decision documentation |

### Skills

#### Core Skills
- **adr-fundamentals** - ADR basics, lifecycle management, best practices
- **adr-decision-drivers** - Identifying and documenting decision drivers
- **adr-quality** - Review criteria, completeness checks, writing quality

#### Format Skills
- **adr-format-madr** - MADR 4.0.0 format (default)
- **adr-format-structured-madr** - MADR with frontmatter, comprehensive options, and audit sections
- **adr-format-nygard** - Classic Nygard format
- **adr-format-y-statement** - Concise Y-Statement format
- **adr-format-alexandrian** - Pattern-based Alexandrian format
- **adr-format-business-case** - MBA-style with SWOT and ROI
- **adr-format-tyree-akerman** - Enterprise-grade comprehensive format

#### Specialized Skills
- **adr-compliance** - Compliance checking patterns and audit workflows
- **adr-integration** - CI/CD integration, documentation sites, tooling

## Configuration

Create `.claude/adr.local.md` in your project root (use `/adr:setup` for guided setup).

See `templates/adr.local.md.example` for a complete configuration template.

```yaml
---
# ADR directories
adr_paths:
  - docs/adr/

# Default template format
default_format: madr
madr_variant: full

# Numbering pattern
numbering:
  pattern: "4digit"
  start_from: 1

# Status workflow
statuses:
  workflow:
    - proposed
    - accepted
    - deprecated
    - superseded
  allow_rejected: true

# Git integration
git:
  enabled: true
  auto_commit: false

# Compliance checking
compliance:
  enabled: true
  check_all_accepted: true
  file_patterns:
    - "**/*.ts"
    - "**/*.py"
---

# Project ADR Context

Add project-specific notes here...
```

## ADR Status Workflow

```
proposed → accepted → [deprecated] → superseded
              ↓
          rejected
```

| Status | Description |
|--------|-------------|
| **proposed** | Decision under consideration |
| **accepted** | Approved and active |
| **rejected** | Considered but not adopted |
| **deprecated** | No longer recommended |
| **superseded** | Replaced by another ADR |

## Template Formats

### MADR (Default)
Markdown Architectural Decision Records - lean, option-focused format with pros/cons analysis.

### Structured MADR
Extended MADR with YAML frontmatter, comprehensive option analysis with risk assessments, and required audit sections. Best for regulated environments.

### Nygard
Classic 5-section format: Title, Status, Context, Decision, Consequences.

### Y-Statement
Single-sentence format capturing context, concern, option, quality, and trade-off.

### Alexandrian
Pattern-oriented format emphasizing forces and resulting context.

### Business Case
Executive-focused with SWOT analysis, cost-benefit, and ROI assessment.

### Tyree-Akerman
Comprehensive enterprise format with full traceability to requirements and principles.

## File Structure

```
adr/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   ├── adr-author.md
│   ├── adr-compliance.md
│   └── adr-researcher.md
├── commands/
│   ├── adr-export.md
│   ├── adr-list.md
│   ├── adr-new.md
│   ├── adr-search.md
│   ├── adr-setup.md
│   ├── adr-supersede.md
│   └── adr-update.md
├── schemas/
│   └── adr-export.schema.json
├── skills/
│   ├── adr-compliance/
│   ├── adr-decision-drivers/
│   ├── adr-format-alexandrian/
│   ├── adr-format-business-case/
│   ├── adr-format-madr/
│   ├── adr-format-nygard/
│   ├── adr-format-structured-madr/
│   ├── adr-format-tyree-akerman/
│   ├── adr-format-y-statement/
│   ├── adr-fundamentals/
│   ├── adr-integration/
│   └── adr-quality/
├── templates/
│   ├── alexandrian/
│   ├── business-case/
│   ├── madr/
│   ├── nygard/
│   ├── structured-madr/
│   ├── tyree-akerman/
│   ├── y-statement/
│   ├── adr.local.md.example
│   └── README-index.md
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## References

- [MADR](https://adr.github.io/madr/) - Markdown Architectural Decision Records
- [ADR Templates](https://adr.github.io/adr-templates/) - Various ADR formats
- [Michael Nygard's ADRs](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original ADR concept

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

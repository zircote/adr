---
name: adr-integration
description: This skill should be used when the user asks about "ADR integration",
  "ADR CI/CD", "ADR tooling", "ADR automation", "export ADRs", "ADR documentation
  site", or needs guidance on integrating ADRs with CI/CD, documentation sites, and
  other tools.
---

# ADR Integration

This skill provides guidance on integrating ADRs with CI/CD pipelines, documentation sites, and other development tools for automated workflows and better discoverability.

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/adr-validation.yml
name: ADR Validation

on:
  pull_request:
    paths:
      - 'docs/adr/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate ADR Format
        run: |
          for file in docs/adr/[0-9]*.md; do
            [ -f "$file" ] || continue
            echo "Validating $file..."

            # Check for required sections
            if ! grep -q "^## Status" "$file"; then
              echo "::error file=$file::Missing Status section"
              exit 1
            fi

            if ! grep -q "^## Context" "$file" && ! grep -q "^## Context and Problem Statement" "$file"; then
              echo "::error file=$file::Missing Context section"
              exit 1
            fi

            if ! grep -q "^## Decision" "$file" && ! grep -q "^## Decision Outcome" "$file"; then
              echo "::error file=$file::Missing Decision section"
              exit 1
            fi
          done
          echo "All ADRs validated successfully"

      - name: Check ADR Numbering
        run: |
          LAST_NUM=0
          for file in docs/adr/[0-9]*.md; do
            NUM=$(basename "$file" | grep -oE '^[0-9]+')
            NUM=$((10#$NUM))
            if [ $NUM -le $LAST_NUM ]; then
              echo "::error::ADR numbering issue: $file"
            fi
            LAST_NUM=$NUM
          done
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - compliance
  - publish

variables:
  ADR_PATH: docs/adr

adr-validate:
  stage: validate
  rules:
    - changes:
        - docs/adr/**
  script:
    - |
      for file in $ADR_PATH/[0-9]*.md; do
        echo "Validating $file"
        grep -q "^## Status" "$file" || (echo "Missing Status in $file" && exit 1)
        grep -q "^## Context" "$file" || grep -q "^## Context and Problem Statement" "$file" || (echo "Missing Context in $file" && exit 1)
        grep -q "^## Decision" "$file" || grep -q "^## Decision Outcome" "$file" || (echo "Missing Decision in $file" && exit 1)
      done

adr-compliance:
  stage: compliance
  rules:
    - changes:
        - src/**
  script:
    - ./scripts/adr-compliance.sh
  allow_failure: true

adr-publish:
  stage: publish
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      changes:
        - docs/adr/**
  script:
    - ./scripts/generate-adr-index.sh
  artifacts:
    paths:
      - docs/adr/README.md
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: adr-lint
        name: Lint ADRs
        entry: ./scripts/lint-adr.sh
        language: script
        files: ^docs/adr/.*\.md$
```

## Documentation Site Integration

### MkDocs

```yaml
# mkdocs.yml
nav:
  - Home: index.md
  - Architecture:
    - Overview: architecture/overview.md
    - Decision Records: architecture/adr/README.md

plugins:
  - search
  - macros:
      module_name: adr_macros
```

### Docusaurus

```js
// docusaurus.config.js
module.exports = {
  docs: {
    sidebar: {
      Architecture: [
        'architecture/overview',
        {
          type: 'category',
          label: 'Decision Records',
          items: ['architecture/adr/README'],
        },
      ],
    },
  },
};
```

### Sphinx

```rst
.. toctree::
   :maxdepth: 2
   :caption: Architecture

   architecture/overview
   architecture/adr/index
```

## Export Formats

### HTML Export

Generate standalone HTML:
- Apply CSS styling
- Include navigation
- Add status badges
- Generate table of contents

See `references/export-templates.md` for full HTML templates with search and filter functionality.

### JSON Export

Export ADRs to JSON for tooling integration. The schema uses `metadata` and `adrs` top-level fields:

```json
{
  "metadata": {
    "project": "My Application",
    "exported": "2024-01-15T10:30:00Z",
    "total": 25,
    "version": "1.0.0"
  },
  "adrs": [
    {
      "id": "0001",
      "title": "Use PostgreSQL for Primary Storage",
      "status": "accepted",
      "date": "2024-01-10",
      "file": "docs/adr/0001-use-postgresql.md",
      "links": {
        "supersedes": [],
        "superseded_by": null,
        "relates_to": ["0003", "0007"]
      }
    }
  ],
  "statistics": {
    "by_status": {
      "accepted": 20,
      "proposed": 3,
      "deprecated": 1,
      "superseded": 1,
      "rejected": 0
    }
  }
}
```

Valid status values: `proposed`, `accepted`, `deprecated`, `superseded`, `rejected`.

#### JSON Export Script

```bash
#!/bin/bash
# scripts/export-json.sh - Export ADRs to JSON

OUTPUT_FILE="${1:-adrs.json}"
ADR_PATH="${ADR_PATH:-docs/adr}"

echo '{' > "$OUTPUT_FILE"
echo '  "metadata": {' >> "$OUTPUT_FILE"
echo "    \"project\": \"$(basename $(pwd))\"," >> "$OUTPUT_FILE"
echo "    \"exported\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "$OUTPUT_FILE"

TOTAL=$(ls "$ADR_PATH"/[0-9]*.md 2>/dev/null | wc -l | tr -d ' ')
echo "    \"total\": $TOTAL" >> "$OUTPUT_FILE"
echo '  },' >> "$OUTPUT_FILE"
echo '  "adrs": [' >> "$OUTPUT_FILE"

FIRST=true
for file in "$ADR_PATH"/[0-9]*.md; do
    [ -f "$file" ] || continue
    [ "$FIRST" = true ] && FIRST=false || echo ',' >> "$OUTPUT_FILE"

    ID=$(basename "$file" | grep -oE '^[0-9]+')
    TITLE=$(grep -m1 "^# " "$file" | sed 's/^# //')
    STATUS=$(grep -A1 "^## Status" "$file" | tail -1 | tr -d '\n\r')

    echo -n "    {\"id\": \"$ID\", \"title\": \"$TITLE\", \"status\": \"$STATUS\", \"file\": \"$file\"}" >> "$OUTPUT_FILE"
done

echo '' >> "$OUTPUT_FILE"
echo '  ]' >> "$OUTPUT_FILE"
echo '}' >> "$OUTPUT_FILE"

echo "JSON export complete: $OUTPUT_FILE"
```

See `references/export-templates.md` for the full JSON schema definition.

### PDF Export

Generate PDFs for stakeholder presentations, audit documentation, offline reading, and compliance records.

#### Using Pandoc

Convert ADR markdown files to PDF with Pandoc:

```bash
# Convert all ADRs to a single PDF with table of contents
pandoc docs/adr/*.md \
  -o adrs.pdf \
  --toc \
  --toc-depth=2 \
  -V geometry:margin=1in \
  -V colorlinks=true \
  --pdf-engine=xelatex \
  --metadata title="Architecture Decision Records"

# Convert a single ADR
pandoc docs/adr/0001-use-postgresql.md \
  -o adr-0001.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in
```

#### LaTeX Template

For professional formatting, use a custom LaTeX template:

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[margin=1in]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}
\usepackage{xcolor}
\usepackage{fancyhdr}

\definecolor{accepted}{RGB}{40, 167, 69}
\definecolor{proposed}{RGB}{255, 193, 7}
\definecolor{deprecated}{RGB}{108, 117, 125}
\definecolor{superseded}{RGB}{220, 53, 69}

\pagestyle{fancy}
\fancyhf{}
\rhead{Architecture Decision Records}
\rfoot{Page \thepage}

\title{Architecture Decision Records}
\date{\today}

\begin{document}
\maketitle
\tableofcontents
\newpage
% ADR content follows
\end{document}
```

Apply with: `pandoc --template=adr-template.tex --pdf-engine=xelatex`

See `references/export-templates.md` for complete templates and export scripts.

## Tool Integrations

### Jira/Issue Trackers

Link ADRs to tickets:
- Create "ADR" issue type
- Link implementation tickets to ADRs
- Track ADR lifecycle in workflow

### Confluence/Wiki

Sync ADRs to wiki:
- Auto-publish accepted ADRs
- Include cross-links
- Maintain version history

### Slack/Teams

ADR notifications:
- New ADR proposed
- ADR accepted/rejected
- Compliance violations

### Architecture Tools

Export to architecture tools:
- C4 model diagrams
- Enterprise architecture tools
- Design documentation

## Git Integration

### Commit Messages

Reference ADRs in commits:
```
feat: implement event-driven order processing

Implements ADR-0012 (Event-Driven Architecture)

- Add order event publisher
- Create payment event handler
- Remove synchronous calls
```

### Branch Naming

Include ADR reference:
```
feature/adr-0012-event-driven-orders
fix/adr-0015-auth-compliance
```

### Pull Request Templates

```markdown
## Related ADRs

- [ ] This PR implements ADR-XXXX
- [ ] This PR complies with accepted ADRs
- [ ] This PR proposes new ADR (link below)

### ADR Compliance Check

- [ ] Architecture patterns followed
- [ ] Technology choices match ADRs
- [ ] No ADR violations introduced
```

## Automation Scripts

### Index Generation

Auto-generate README.md index:

```bash
#!/bin/bash
# scripts/generate-adr-index.sh

ADR_PATH="${ADR_PATH:-docs/adr}"
INDEX_FILE="$ADR_PATH/README.md"

cat > "$INDEX_FILE" << 'EOF'
# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for this project.

## ADR Index

| ID | Title | Status |
|----|-------|--------|
EOF

for file in "$ADR_PATH"/[0-9]*.md; do
    [ -f "$file" ] || continue
    BASENAME=$(basename "$file")
    ID=$(echo "$BASENAME" | grep -oE '^[0-9]+')
    TITLE=$(grep -m1 "^# " "$file" | sed 's/^# //' | sed 's/^[0-9]*\. //')
    STATUS=$(grep -A1 "^## Status" "$file" | tail -1 | head -1 | tr -d '\n\r')

    echo "| $ID | [$TITLE](./$BASENAME) | $STATUS |" >> "$INDEX_FILE"
done

echo "Index generated: $INDEX_FILE"
```

### Link Validation

Check ADR cross-references:
```bash
#!/bin/bash
# Validate ADR links
ADR_PATH="${ADR_PATH:-docs/adr}"

for file in "$ADR_PATH"/*.md; do
  grep -oE 'ADR-[0-9]+' "$file" | while read ref; do
    NUM=$(echo "$ref" | grep -oE '[0-9]+')
    TARGET=$(ls "$ADR_PATH"/${NUM}*.md 2>/dev/null)
    if [ -z "$TARGET" ]; then
      echo "WARNING: $file references $ref but no matching file found"
    fi
  done
done
```

### Status Sync

Ensure bidirectional links:
```bash
#!/bin/bash
# Sync supersedes/superseded-by
ADR_PATH="${ADR_PATH:-docs/adr}"

for file in "$ADR_PATH"/*.md; do
  # If A supersedes B, verify B has superseded-by: A
  grep -i "supersedes.*ADR-" "$file" | grep -oE 'ADR-[0-9]+' | while read ref; do
    NUM=$(echo "$ref" | grep -oE '[0-9]+')
    TARGET=$(ls "$ADR_PATH"/${NUM}*.md 2>/dev/null)
    if [ -n "$TARGET" ]; then
      SELF_ID=$(basename "$file" | grep -oE '^[0-9]+')
      if ! grep -q "Superseded by.*ADR-${SELF_ID}" "$TARGET" 2>/dev/null; then
        echo "WARNING: $file supersedes $ref but $TARGET has no superseded-by reference"
      fi
    fi
  done
done
```

## Monitoring and Metrics

### ADR Health Dashboard

Track metrics:
- Total ADRs by status
- ADRs created per month
- Average time to accept
- Supersession rate
- Compliance violations

### Alerts

Set up notifications for:
- ADRs proposed > 30 days
- Deprecated ADRs without successors
- Compliance violations
- Missing links/metadata

## Configuration

Configure integrations in `.claude/adr.local.md`:

```yaml
git:
  enabled: true
  auto_commit: false
  commit_template: "docs(adr): {action} ADR-{id} {title}"

export:
  default_format: html
  html_template: default
  include_toc: true
  output_dir: null

integration:
  docs_site: mkdocs
  issue_tracker: jira
  notifications: slack
```

## Additional Resources

### Reference Files

- **`references/ci-templates.md`** - Full CI/CD pipeline templates (GitHub Actions, GitLab CI, Azure DevOps, Jenkins, CircleCI)
- **`references/export-templates.md`** - Export format templates (HTML, JSON schema, LaTeX, export scripts)

### Related Skills

- **adr-compliance** - Compliance checking integration
- **adr-fundamentals** - Basic ADR workflow

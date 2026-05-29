# Frontmatter-First Search for Structured MADR Collections

A progressive-disclosure methodology for searching, filtering, and navigating a
collection of Structured MADR (SMADR) records efficiently.

## Why

SMADR requires rich YAML frontmatter (`title`, `description`, `category`, `tags`,
`status`, `created`, `updated`, `author`, `project`, `technologies`, `audience`,
`related`). That frontmatter is a cheap, structured index. When searching a
collection, read the frontmatter across all records **first** to triage and
decide, then read full bodies **only** for the relevant shortlist. This avoids
reading every ADR end-to-end — saving tokens and improving decision quality.

## Conventions

These recipes assume the project's ADR conventions:

- ADR path: `ADR_PATH="${ADR_PATH:-docs/adr}"` (configurable in `.claude/adr.local.md`).
- File pattern: `[0-9]*.md` (numeric-prefixed filenames).
- Frontmatter is the leading `---` ... `---` block.

## Small-collection shortcut

For a small collection (fewer than ~10 records), do **not** build a shell index.
Read just the leading frontmatter block of each file directly with the Read tool
— that already *is* Stage A. Switch to the shell recipes below at ~10+ records.

## The 3-Stage Protocol

### Stage A — Index frontmatter only (no bodies)

Extract just the frontmatter block from a single file:

```bash
awk '/^---$/{c++; next} c==1{print} c>=2{exit}' "$file"
```

Project every record's frontmatter into one compact triage table in a single
pass (scalars and multi-line list fields like `tags`/`related` are collapsed to
comma-joined values; bodies are never read):

```bash
ADR_PATH="${ADR_PATH:-docs/adr}"
{ printf 'file\tstatus\tcategory\ttags\trelated\n'
  for f in "$ADR_PATH"/[0-9]*.md; do
    awk -v file="$f" '
      /^---$/{c++; next}
      c==1 && /^[a-z_]+:[ \t]*$/ { key=$1; sub(/:$/,"",key); inlist=1; lk=key; next }
      c==1 && /^[a-z_]+:/        { inlist=0; key=$1; sub(/:.*/,"",key);
                                   val=$0; sub(/^[a-z_]+:[ \t]*/,"",val); vals[key]=val; next }
      c==1 && inlist && /^[ \t]+-/ { v=$0; sub(/^[ \t]+-[ \t]*/,"",v);
                                   vals[lk]=vals[lk] (vals[lk]?",":"") v; next }
      c>=2 { exit }
      END { printf "%s\t%s\t%s\t%s\t%s\n", file, vals["status"], vals["category"], vals["tags"], vals["related"] }
    ' "$f"
  done
} | column -t -s $'\t'
```

The list-header rule (`key:` with nothing after the colon) is checked **before**
the scalar rule, so `tags:` is recognized as a list rather than an empty scalar.
Add or swap projected fields by editing the `END` `printf` and the `vals[...]`
keys (e.g. `technologies`, `audience`, `created`, `updated`).

### Stage B — Filter, rank, and decide

Read a single scalar field from one file:

```bash
awk '/^---$/{c++;next} c==1 && /^status:/{sub(/^status:[ \t]*/,"");print;exit}' "$file"
```

Filter the triage table (e.g. accepted records whose tags mention `database`):

```bash
# ...triage pipeline... | awk -F'\t' '$2=="accepted" && $4 ~ /database/'
```

Filter on any indexed dimension the same way: `status`, `category`, `tags`,
`technologies`, `audience`, or a `created`/`updated` date range. Build the
cross-reference graph from the `related` column.

Ranking heuristic (mirrors the `adr-search` command): order by status acceptance
— accepted, then proposed, then deprecated, then superseded — and within a
status, most-recently `updated` first.

**When reporting triage results, briefly state why each excluded record was
dropped** — not just which records survived. For example: "excluded 0009
(category: ui, not database)" or "excluded 0005 (status: proposed, not
accepted)". One phrase per excluded record is sufficient. This makes the
filtering logic transparent and auditable.

### Stage C — Deep-read the shortlist and traverse `related`

Read full bodies **only** for the shortlisted records (Context, Decision,
Consequences, Audit). Then follow each record's `related:` entries.

Resolve a `related:` entry by **ADR number, not exact filename**. The template
writes related entries in the `adr_NNNN.md` underscore form, but on-disk files
use the `NNNN-slug.md` form, so an exact-name lookup misses:

```bash
rel="adr_0005.md"
num=$(printf '%s' "$rel" | grep -oE '[0-9]+')
ls "$ADR_PATH"/*"$num"*.md
```

## Optional enhancement: yq

If `yq` is available it parses frontmatter natively and handles list fields
without awk. This is optional — the pure-shell recipes above are the baseline,
consistent with the project's dependency-light tooling.

```bash
# Per-file: status, category, comma-joined tags
yq --front-matter=extract '[.status, .category, (.tags // [] | join(","))] | @tsv' "$file"
```

## Worked example

A collection of three SMADR records:

- `0001-use-postgresql.md` — `status: accepted`, `category: architecture`,
  `tags: [database, persistence]`, `related: [adr_0005.md]`
- `0005-event-sourcing.md` — `status: proposed`, `category: architecture`,
  `tags: [database, events]`, `related: [adr_0001.md]`
- `0009-design-system.md` — `status: accepted`, `category: ui`,
  `tags: [frontend, design]`

To answer "which accepted database decisions do we have, and what do they relate
to?":

1. **Stage A** builds the triage table from frontmatter alone (no bodies read).
2. **Stage B** filters `status=accepted` and `tags ~ database`. Report the
   triage outcome with reasons for each exclusion:
   - **0001-use-postgresql.md** — included (status: accepted, tags: database)
   - **0005-event-sourcing.md** — excluded (status: proposed, not accepted)
   - **0009-design-system.md** — excluded (category: ui, tags: frontend — not database)
3. **Stage C** reads only `0001`'s body, then resolves its `related: adr_0005.md`
   to `0005-event-sourcing.md` by number and reads that record's body.

Two bodies read instead of three — and the irrelevant `0009` is excluded purely
from its frontmatter.

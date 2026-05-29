#!/usr/bin/env node

/**
 * Generates Starlight MDX pages from source markdown docs.
 * Reads docs-mapping.json for source-to-output mapping.
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..", "..");
const siteRoot = resolve(__dirname, "..");

/**
 * Build a unified link map keyed by project-root-relative normalized path.
 */
function buildLinkMap(mappingPages) {
  const linkMap = {};

  // Map each source file to its output URL
  for (const page of mappingPages) {
    const normalized = normalize(page.source);
    const url = "/" + page.output.replace(/\.mdx$/, "/");
    linkMap[normalized] = url;
  }

  // Skills mappings (for cross-references from docs to skills)
  const skillsDir = join(projectRoot, "skills");
  if (existsSync(skillsDir)) {
    const skillDirs = readdirSync(skillsDir).filter((d) => {
      const fullPath = join(skillsDir, d);
      return (
        statSync(fullPath).isDirectory() &&
        existsSync(join(fullPath, "SKILL.md"))
      );
    });
    for (const skill of skillDirs) {
      linkMap[normalize(`skills/${skill}/SKILL.md`)] = `/skills/${skill}/`;
    }
  }

  // External links for files not included in the site
  linkMap["README.md"] = "https://github.com/zircote/adr/blob/main/README.md";

  return linkMap;
}

/**
 * Rewrite relative markdown links to Starlight URLs.
 */
function rewriteLinks(content, linkMap, sourceFile) {
  const sourceDir = dirname(sourceFile);

  return content.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, href) => {
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("#") ||
      href.startsWith("mailto:")
    ) {
      return match;
    }

    const [pathPart, anchor] = href.split("#");
    if (!pathPart) return match;

    const resolved = normalize(join(sourceDir, pathPart));

    if (linkMap[resolved]) {
      const suffix = anchor ? `#${anchor}` : "";
      return `[${text}](${linkMap[resolved]}${suffix})`;
    }

    // Filename fallback: only rewrite when exactly one mapping unambiguously
    // matches the basename. Bailing on 0 or >1 matches avoids both the
    // empty-filename (trailing slash) case matching everything and basename
    // collisions (e.g. every skill's SKILL.md) resolving to the wrong page.
    const filename = pathPart.split("/").pop();
    if (filename) {
      const matches = Object.entries(linkMap).filter(
        ([key]) => key === filename || key.endsWith(`/${filename}`),
      );
      if (matches.length === 1) {
        const suffix = anchor ? `#${anchor}` : "";
        return `[${text}](${matches[0][1]}${suffix})`;
      }
    }

    return match;
  });
}

function stripFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, "");
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function buildFrontmatter(page, extractedTitle) {
  const title = page.title || extractedTitle || "Untitled";
  const lines = ["---"];
  lines.push(`title: "${title}"`);
  if (page.description) {
    lines.push(`description: "${page.description}"`);
  }
  if (page.sidebarLabel && page.sidebarLabel !== title) {
    lines.push(`sidebar:`);
    lines.push(`  label: "${page.sidebarLabel}"`);
  }
  lines.push("---");
  return lines.join("\n");
}

/**
 * Escape MDX-invalid constructs: curly braces outside code blocks/inline code.
 */
function escapeMdx(content) {
  const lines = content.split("\n");
  let fence = null; // { char, len } while inside a fenced code block
  const result = [];

  for (const line of lines) {
    const fenceMatch = line.trimStart().match(/^(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const info = fenceMatch[2].trim();
      if (fence === null) {
        // Opening fence — an info string (e.g. ```rust) is allowed here.
        fence = { char: marker[0], len: marker.length };
      } else if (
        marker[0] === fence.char &&
        marker.length >= fence.len &&
        info === ""
      ) {
        // A closing fence must use the same char, be at least as long, and
        // carry no info string. This keeps nested ```lang fences inside an
        // outer ```markdown block from prematurely ending it.
        fence = null;
      }
      result.push(line);
      continue;
    }
    if (fence !== null) {
      result.push(line);
      continue;
    }

    let escaped = "";
    let inInlineCode = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "`") {
        inInlineCode = !inInlineCode;
        escaped += ch;
      } else if (!inInlineCode && (ch === "{" || ch === "}")) {
        escaped += ch === "{" ? "\\{" : "\\}";
      } else if (!inInlineCode && ch === "<") {
        const next = line[i + 1];
        if (next && /[a-zA-Z/!]/.test(next)) {
          escaped += ch;
        } else {
          escaped += "&lt;";
        }
      } else if (
        !inInlineCode &&
        ch === ">" &&
        i > 0 &&
        !/[a-zA-Z"'/\-\d]/.test(line[i - 1])
      ) {
        escaped += "&gt;";
      } else {
        escaped += ch;
      }
    }
    result.push(escaped);
  }

  return result.join("\n");
}

/**
 * Generate docs pages, optionally to a custom output directory.
 * @param {string} [outputBase] - Override output base directory (for freshness checks)
 * @returns {{ generated: string[], skipped: string[] }}
 */
export function generateDocsPages(outputBase) {
  const mapping = JSON.parse(
    readFileSync(join(__dirname, "docs-mapping.json"), "utf-8"),
  );
  const linkMap = buildLinkMap(mapping.pages);
  const outDir = outputBase || join(siteRoot, mapping.outputDir);
  const generated = [];
  const skipped = [];

  for (const page of mapping.pages) {
    const sourcePath = join(projectRoot, page.source);
    if (!existsSync(sourcePath)) {
      console.warn(`  SKIP: ${page.source} (not found)`);
      skipped.push(page.source);
      continue;
    }

    const raw = readFileSync(sourcePath, "utf-8");
    const stripped = stripFrontmatter(raw);
    const extractedTitle = extractTitle(stripped);
    const frontmatter = buildFrontmatter(page, extractedTitle);

    // Strip HTML comments (invalid in MDX)
    let body = stripped.replace(/<!--[\s\S]*?-->/g, "");

    // Rewrite markdown links
    body = rewriteLinks(body, linkMap, page.source);

    // Strip H1 (title comes from frontmatter)
    const h1Match = body.match(/^\s*#\s+.+\n+/);
    if (h1Match) {
      body = body.slice(h1Match[0].length);
    }

    // Escape MDX-invalid constructs
    body = escapeMdx(body);

    const content = `${frontmatter}\n\n${body.trim()}\n`;
    const outPath = join(outDir, page.output);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, "utf-8");
    console.log(`  OK: ${page.output}`);
    generated.push(page.output);
  }

  return { generated, skipped };
}

// Run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("Generating docs pages...");
  const { generated, skipped } = generateDocsPages();
  console.log(
    `\nDone: ${generated.length} generated, ${skipped.length} skipped.`,
  );
}

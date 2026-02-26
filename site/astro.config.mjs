import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import astroMermaid from "astro-mermaid";

export default defineConfig({
  site: "https://zircote.com",
  base: "/adr",
  integrations: [
    astroMermaid(),
    starlight({
      title: "ADR Plugin",
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://zircote.com/adr/og-image.svg",
          },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:width", content: "1280" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:height", content: "640" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:card", content: "summary_large_image" },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image",
            content: "https://zircote.com/adr/og-image.svg",
          },
        },
      ],
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: true,
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/zircote/adr",
        },
      ],
      sidebar: [
        {
          label: "Overview",
          items: [
            { label: "Introduction", slug: "index" },
            { label: "Changelog", slug: "changelog" },
          ],
        },
        {
          label: "Commands",
          items: [
            { label: "/adr:setup", slug: "commands/adr-setup" },
            { label: "/adr:new", slug: "commands/adr-new" },
            { label: "/adr:list", slug: "commands/adr-list" },
            { label: "/adr:update", slug: "commands/adr-update" },
            { label: "/adr:supersede", slug: "commands/adr-supersede" },
            { label: "/adr:search", slug: "commands/adr-search" },
            { label: "/adr:export", slug: "commands/adr-export" },
          ],
        },
        {
          label: "Agents",
          items: [
            { label: "ADR Author", slug: "agents/adr-author" },
            { label: "ADR Compliance", slug: "agents/adr-compliance" },
            { label: "ADR Researcher", slug: "agents/adr-researcher" },
          ],
        },
        {
          label: "Skills — Core",
          items: [
            { label: "ADR Fundamentals", slug: "skills/adr-fundamentals" },
            { label: "Decision Drivers", slug: "skills/adr-decision-drivers" },
            { label: "ADR Quality", slug: "skills/adr-quality" },
          ],
        },
        {
          label: "Skills — Formats",
          items: [
            { label: "MADR", slug: "skills/adr-format-madr" },
            {
              label: "Structured MADR",
              slug: "skills/adr-format-structured-madr",
            },
            { label: "Nygard", slug: "skills/adr-format-nygard" },
            { label: "Y-Statement", slug: "skills/adr-format-y-statement" },
            { label: "Alexandrian", slug: "skills/adr-format-alexandrian" },
            { label: "Business Case", slug: "skills/adr-format-business-case" },
            { label: "Tyree-Akerman", slug: "skills/adr-format-tyree-akerman" },
          ],
        },
        {
          label: "Skills — Specialized",
          items: [
            { label: "ADR Compliance", slug: "skills/adr-compliance" },
            { label: "ADR Integration", slug: "skills/adr-integration" },
          ],
        },
        {
          label: "Reference Materials",
          items: [
            {
              label: "Decision Criteria",
              slug: "references/decision-criteria",
            },
            { label: "Review Checklist", slug: "references/review-checklist" },
            {
              label: "Quality Attributes",
              slug: "references/quality-attributes",
            },
            {
              label: "Trade-off Patterns",
              slug: "references/trade-off-patterns",
            },
            { label: "MADR Examples", slug: "references/madr-examples" },
            {
              label: "Structured MADR Examples",
              slug: "references/structured-madr-examples",
            },
            {
              label: "Compliance Patterns",
              slug: "references/compliance-patterns",
            },
            {
              label: "Compliance Automation",
              slug: "references/compliance-automation",
            },
            { label: "CI Templates", slug: "references/ci-templates" },
            { label: "Export Templates", slug: "references/export-templates" },
          ],
        },
      ],
    }),
  ],
});

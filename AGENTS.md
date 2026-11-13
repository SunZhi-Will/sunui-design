# SunUI: instructions for AI agents working in this repo

SunUI is a shadcn registry of paper-feel animated React + Tailwind blocks. Positioning (changed 2026-11-13): the headline is the paper feel and the motion, not an industry. Stores and campaign pages are the flagship collection and the Pro focus, not the limit of the catalog. Reasoning: `reports/SunUI 定位是否跳出電商.md`. The live product is `apps/web` (catalog site + registry endpoints). Read this file first, then the file named for your task.

## Where things are

| Path | What |
|---|---|
| `apps/web/registry/free/<name>/` | Free block source (`<name>.tsx`) and `demo.tsx` |
| `apps/web/registry/pro/` | Pro blocks. A separate private git repo, gitignored here. May be missing; the build must still work |
| `apps/web/registry.json` | Free registry manifest (shadcn format + `meta`: tier, series, interaction, usage) |
| `apps/web/content/registry-i18n/<name>.json` | zh-TW, zh-CN, ja copy for each free block |
| `apps/web/registry/lab/` | Blocks moved out of the catalog (off-strategy). Not served |
| `apps/web/lib/agent/` | Everything AI-facing: search, install plans, design rules for agents, the SunUI skill |
| `apps/web/app/mcp/route.ts` | SunUI MCP server (Streamable HTTP, read-only) |
| `apps/web/app/llms.txt`, `llms-full.txt`, `r/`, `skills/` | Plain-text and registry endpoints |
| `packages/*`, `src/`, `.cursorrules/` | Legacy npm packages and their old docs. Do not add new work there |
| `reports/` | Strategy and design analyses (Chinese). Context, not specs |

## Rules by task

- **Free catalog is frozen (decided 2026-11-06, until the 2027-01-12 Product Hunt launch)**: do not add new free blocks or motion effect libraries (now 75 free blocks + 28 motion libraries; theme-picker was added 2026-11-07 as an atom of the Pro day-night-hero). A new free item is allowed only if it is an atom pulled out of a Pro scene. Put the time into Pro scenes and launch work. Reasoning: `reports/商業模式深度分析-2026-11-06.md`.
- **Adding or editing a block**: follow `apps/web/README.md` (steps) and the design doc for its series: `apps/web/DESIGN.md` (paper, default), `DESIGN-product.md`, `DESIGN-story.md`. Ported blocks follow `apps/web/PORTING.md`. Add `meta.usage` (`whenToUse`, `watchOut`, `aliases`): agents search on it.
- **Site chrome motion** (header, catalog, panels, home hero, docs pages, not blocks): follow `apps/web/SITE-MOTION.md`. Durations and the easing curve come from `lib/motion.ts` and the `@theme` block in `app/globals.css`.
- **Changing a design doc**: update `apps/web/lib/agent/guidelines.ts` too. It is the English copy that the MCP server, the skill and `llms-full.txt` serve.
- **Pro code**: never copy Pro source into the public repo, a page, the MCP server or `llms-full.txt`. Only `/r/pro/*` serves it, behind a license check.
- **Copy**: user-facing copy lives in `apps/web/lib/messages.ts` in four locales (en, zh-TW, zh-CN, ja). Change all four.
- Do not use em dashes in any copy or docs.

## Commands (run from repo root)

```bash
npm run web:dev                          # http://localhost:3100
npm run typecheck -w @sunui-design/web   # regenerates previews first
npm run web:build
```

## MCP for working on this repo

`.mcp.json` registers the local SunUI MCP server (`http://localhost:3100/mcp`, needs `npm run web:dev`) and the shadcn MCP server. Use `search_blocks` before creating a new block to check it does not already exist.

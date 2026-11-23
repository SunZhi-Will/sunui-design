# SunUI: instructions for AI agents working in this repo

SunUI is a shadcn registry of refined animated React + Tailwind blocks. Positioning (changed 2026-11-13, headline updated 2026-11-18): the headline is craft quality (質感) and the motion, not paper and not an industry. On 2026-11-19 paper was dropped as a design language too: it was a misreading of 質感. The default series is `craft` (`apps/web/DESIGN.md`); the old id `paper` is read as `craft`. Do not reintroduce paper and ink hex colours, perforations or stamps. Plan for redoing existing blocks: `reports/拋棄紙感全面改質感深度分析-2026-11-18.md`. Shell values: `apps/web/SITE-MOTION.md` section 5. Stores and campaign pages are the flagship collection and the Pro focus, not the limit of the catalog. Reasoning: `reports/SunUI 定位是否跳出電商.md`. The live product is `apps/web` (catalog site + registry endpoints). Read this file first, then the file named for your task.

## Where things are

| Path | What |
|---|---|
| `apps/web/app/(site)/page.tsx`, `apps/web/components/home/` | Home page (remade 2026-11-19): a narrative page, not the catalog. Hero specimens are site components, not registry blocks. Rules: `apps/web/SITE-MOTION.md` section 6 |
| `apps/web/app/(site)/blocks/page.tsx` | Full catalog with search and filters (moved off the home page 2026-11-19) |
| `apps/web/registry/free/<name>/` | Free block source (`<name>.tsx`) and `demo.tsx` |
| `apps/web/registry/pro/` | Pro blocks. A separate private git repo, gitignored here. May be missing; the build must still work |
| `apps/web/registry.json` | Free registry manifest (shadcn format + `meta`: tier, series, interaction, usage) |
| `apps/web/content/registry-i18n/<name>.json` | zh-TW, zh-CN, ja copy for each free block |
| `apps/web/registry/lab/` | Blocks moved out of the catalog (off-strategy). Not served |
| `apps/web/lib/agent/` | Everything AI-facing: search, install plans, design rules for agents, the SunUI skill |
| `apps/web/lib/agent/port.ts`, `lib/agent/port/*.md`, `app/r/port/` | Port guides (added 2026-11-23): carry a block to Vue or SwiftUI. One adapter file per platform plus the block's source; the source is the spec, so there is no per-block prose spec. Pilot and method: `reports/可攜式Prompt跨平台深度分析-2026-11-23.md` |
| `apps/web/app/mcp/route.ts` | SunUI MCP server (Streamable HTTP, read-only) |
| `apps/web/app/llms.txt`, `llms-full.txt`, `r/`, `skills/` | Plain-text and registry endpoints |
| `packages/*`, `src/`, `.cursorrules/` | Legacy npm packages and their old docs. Do not add new work there |
| `reports/` | Strategy and design analyses (Chinese). Context, not specs |

## Rules by task

- **Free catalog is frozen (decided 2026-11-06, until the 2027-01-12 Product Hunt launch)**: do not add new free blocks or motion effect libraries (now 75 free blocks + 28 motion libraries; theme-picker was added 2026-11-07 as an atom of the Pro day-night-hero). A new free item is allowed only if it is an atom pulled out of a Pro scene. Second exception (approved by the user 2026-11-20): restoring a block that was removed under the old commerce-and-paper positioning, only if it is on the list in `reports/舊元件盤點與恢復深度分析-2026-11-20.md` and is redone to `apps/web/DESIGN.md`. Third exception (user, 2026-11-22): the classic npm components FloatingButton, SocialButton and FilterGrid come back as `floating-social`, `social-button` and `skill-grid` (`reports/經典SunUI元件深度分析-2026-11-21.md` section 7). Put the time into Pro scenes and launch work. Reasoning: `reports/商業模式深度分析-2026-11-06.md`.
- **Adding or editing a block**: follow `apps/web/README.md` (steps) and the design doc for its series: `apps/web/DESIGN.md` (craft, default), `DESIGN-product.md`, `DESIGN-story.md`. Ported blocks follow `apps/web/PORTING.md`. Add `meta.usage` (`whenToUse`, `watchOut`, `aliases`): agents search on it.
- **Site chrome motion** (header, catalog, panels, home hero, docs pages, not blocks): follow `apps/web/SITE-MOTION.md`. Durations and the easing curve come from `lib/motion.ts` and the `@theme` block in `app/globals.css`.
- **Changing a design doc**: update `apps/web/lib/agent/guidelines.ts` too. It is the English copy that the MCP server, the skill and `llms-full.txt` serve.
- **Pro code**: never copy Pro source into the public repo, a page, the MCP server or `llms-full.txt`. Only `/r/pro/*` serves it, behind a license check. A Pro port guide contains Pro source too: only `/r/port/<platform>/<name>.md` builds it, after the same license check; pages and the MCP server get `proPortInstructions()`.
- **Port guides**: positioning stays "React gets code, other platforms get a port guide" (not a prompt library). Add a block to the `verified` list in `lib/agent/port.ts` only after running its guide with a fresh agent and comparing the result with the original. Add a platform only with an adapter that has been through the same test.
- **Keep shadcn coupling thin (2026-11-22)**: shadcn is only the delivery format and CLI. Blocks must not depend on shadcn/ui components, Radix, Base UI or `shadcn/tailwind.css`; import `cn` from `@/lib/utils`, not the `cn` package; `registryDependencies` may only be `utils` and SunUI's own items. Colour classes stay on the standard shadcn token names; `apps/web/public/sunui-theme.css` supplies them for projects without shadcn, so keep it in step when a block needs a new token. If the shadcn CLI or format ever turns against us, the fallback is a small `npx sunui add` that reads the same `/r/*.json`; do not build it before then. Reasoning: `reports/shadcn綁定與非shadcn用戶最佳方案-2026-11-22.md`.
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

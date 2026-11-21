<div align="center">

# SunUI

**Animated React blocks with real craft. One command to install.**

[Website](https://sunui.synvize.com) · [Browse blocks](https://sunui.synvize.com/blocks) · [Docs](https://sunui.synvize.com/docs/installation) · [Pro](https://sunui.synvize.com/pricing) · [中文](README.zh.md)

</div>

SunUI is a [shadcn](https://ui.shadcn.com) registry of refined, animated React and Tailwind blocks. You do not install a package. You copy the source into your project with the shadcn CLI, and from then on it is your code to change.

- **Craft first.** Springs instead of linear fades, a pressed state on everything you can press, layered shadows and restrained colour.
- **Built on your theme.** Blocks use shadcn tokens (`bg-card`, `text-muted-foreground`, `bg-primary`), so they pick up your colours and dark mode.
- **Free blocks and motion libraries.** Over 100 items under MIT: product page parts, feedback, navigation, backgrounds, text, charts, scroll and SVG effects.
- **Pro scenes.** Whole screens already composed (heroes, checkout, cart, campaign pages), installed the same way with a license key.
- **Ready for agents.** An MCP server, `llms.txt` and a SunUI skill let coding agents search the catalog and draft an install plan.

## Install a block

Set up shadcn in your project once:

```bash
npx shadcn@latest init
```

Then add any block by its URL:

```bash
npx shadcn@latest add https://sunui.synvize.com/r/countdown-banner.json
```

Or register SunUI as a namespace in `components.json`:

```json
{
  "registries": {
    "@sunui": "https://sunui.synvize.com/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @sunui/countdown-banner
```

Every block page on the website shows a live demo, its props and the exact command.

## Use it with an AI agent

| Endpoint | What |
|---|---|
| `https://sunui.synvize.com/mcp` | MCP server (Streamable HTTP, read-only): search blocks, read usage notes, get install commands |
| `https://sunui.synvize.com/llms.txt` | Short plain-text index of the catalog |
| `https://sunui.synvize.com/llms-full.txt` | Full catalog with design rules |

Setup for Claude Code, Cursor and others: [AI agents docs](https://sunui.synvize.com/docs/ai-agents).

## Pro

Pro scenes are served from `@sunui-pro` behind a license key. See [pricing](https://sunui.synvize.com/pricing) and the [Pro docs](https://sunui.synvize.com/docs/pro).

## Repository layout

| Path | What |
|---|---|
| `apps/web` | The website and the registry endpoints (Next.js) |
| `apps/web/registry/free` | Free block source |
| `packages/*` | Legacy npm packages, no longer developed (see below) |

Run the site locally:

```bash
npm install
npm run web:dev   # http://localhost:3100
```

How to add or edit a block: [`apps/web/README.md`](apps/web/README.md).

## Legacy npm packages

Earlier versions of SunUI shipped as npm packages (`@sunui-design/react` and eight component packages, last version 0.0.55). They are no longer developed and do not follow the current design. Each one has a successor in the registry:

| Old package | Use instead |
|---|---|
| `@sunui-design/card` | `card-effects`, `skeleton-set` |
| `@sunui-design/countdown-banner` | `countdown-banner` |
| `@sunui-design/side-panel` | `side-panel` |
| `@sunui-design/floating` | `morph-menu` (radial layout) |
| `@sunui-design/social` | `social-links` |
| `@sunui-design/gradient` | `gradient-backdrop` |
| `@sunui-design/file-upload` | `file-dropzone` (Pro) |
| `@sunui-design/filter` | No direct successor |

Their source stays in `packages/` for existing users.

## License

Free blocks and this repository are [MIT](LICENSE). Pro scenes are covered by the SunUI Pro license.

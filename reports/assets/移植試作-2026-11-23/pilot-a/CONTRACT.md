# Acceptance script contract (pilot A)

One script per block: `scripts/<block>.mjs`. The same script runs on the React original and on every port. Its output is compared by `compare.mjs`, which is plain code with no model in the loop, so the output must be measurements, not opinions.

## Command line

```
node scripts/<block>.mjs --url <url> --root "<css selector>" --out <file.json> --label <name>
```

- Original: `--url "http://localhost:3100/preview/<block>?l=en" --root "[data-preview-stage]"`
- Ports: `--url "http://localhost:<port>/?only=<block>" --root "[data-demo]"`

Run with node from any folder. Import playwright-core by absolute path:
`import { chromium } from "playwright-core";`
Launch Chrome:
`import { findChrome } from "/Applications/Projects/nextjs/sunui-design/apps/web/scripts/find-chrome.mjs"; const f = findChrome(); const exe = typeof f === "string" ? f : f.path ?? Object.values(f)[0]; chromium.launch({ executablePath: exe, headless: true })`

## What the script must do

- A fresh browser context per scenario, locale `en-US`, colorScheme `light`, viewport 1100x900, and an init script that sets localStorage `sunui-theme` to `light`.
- The original's demo may replay itself (an autoplay with a fake cursor). First do a real pointer press inside the root on an empty spot, then wait until the demo is at rest. Do the same on ports (it is harmless there).
- Run the reduced-motion scenarios itself, in a context created with `reducedMotion: "reduce"`.
- Find elements only by role, accessible name, aria attributes, visible text or `data-*` that the checklist names. Never by class names, tag nesting or nth-child: the ports are different implementations and the same script must fit all of them.
- Use real mouse and keyboard events.
- Every checklist item gets its own `try/catch`. A failure goes into `errors` with the item id; the script never crashes as a whole and always writes the output file.
- Screenshots are optional: `shots/<block>-<label>-<step>.png` in the pilot folder.

## Output file

```json
{
  "block": "pagination",
  "label": "original",
  "url": "...",
  "checks": [
    { "item": "<checklist id>", "key": "<unique key>", "kind": "exact", "value": "Page 3 of 12" }
  ],
  "tabOrder": ["button:Previous page", "link:1"],
  "consoleErrors": [],
  "errors": [{ "item": "<checklist id>", "message": "..." }]
}
```

`key` is unique in the file and identical across targets (it names the measurement, never the target). `item` is a checklist id from `apps/web/content/port-checklists/<block>.json`.

### kinds and how compare.mjs judges them

| kind | value | passes when |
|---|---|---|
| `exact` | string, boolean, or array of strings | equal to the original (all three baseline runs agree) |
| `count` | integer | equal |
| `px` | number, pixels | inside the baseline range widened by 1.5px |
| `ratio` | number such as a scale, opacity or fraction 0..1 | inside the baseline range widened by 0.03 |
| `ms` | number, milliseconds | inside the baseline range widened by 25% (at least 40ms) |
| `dir` | `"up" "down" "left" "right" "grow" "shrink" "none"` | equal |
| `info` | anything | never compared; kept for people reading the file |

### Rules for animations

A curve is never stored raw as a compared value. Sample every animation frame (`requestAnimationFrame`) and reduce each curve to scalars:

- `<name>.animates` (exact, boolean): did it move over more than one frame. This catches a snap where the original moves, and the reverse.
- `<name>.firstDir` (dir): the direction of the first movement larger than 0.3px (or 0.01 for ratios). This catches a spring that starts the wrong way.
- `<name>.start`, `<name>.peak` (or `.min`), `<name>.end` (px or ratio, relative to the element's resting position or to the root, never page coordinates).
- `<name>.settleMs` (ms): time from the trigger until the value stays within 0.5px (0.01) of the end.

Store the raw frames as `info` if they help a reader.

### What not to compare

- Colours, font families, shadows: the ports use a neutral theme. Do not record them as compared kinds.
- Widths or x positions that depend on text width: record them as `info`. Heights, gaps, paddings and positions of non-text elements may be `px`.
- Absolute page coordinates: always relative to the root or to the element's own rest position.
- Placeholder product names or images that the checklist says may differ.

### Tab order

`tabOrder`: press Tab from before the root through the whole demo, record each focused element inside the root as `<tag or role>:<accessible name or text, trimmed to 30 chars>`, and stop when focus leaves the root. Ignore Next.js dev overlay nodes. compare.mjs requires the sequence to be equal to the original's.

## Coverage

Every checklist item whose scope is `all` or `web` must have at least one compared check (not `info`), or an entry in `errors` saying why it cannot be measured.

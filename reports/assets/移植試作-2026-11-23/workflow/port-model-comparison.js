export const meta = {
  name: 'port-model-comparison',
  description: 'Port two SunUI blocks to Vue with three different models, then have an independent judge run all ports against the original',
  phases: [
    { title: 'Port', detail: 'haiku, sonnet and opus each port the block from the guide alone' },
    { title: 'Verify', detail: 'one judge per block drives the original and the three ports with the same script' },
  ],
}

const X = '/private/tmp/claude-501/-Users-sun--claude-spares-spare-pTIojw/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/exp'
const CAP = '/private/tmp/claude-501/-Users-sun--claude-spares-spare-pTIojw/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/pilot/cap'
const MODELS = [
  { id: 'haiku', port: 3141 },
  { id: 'sonnet', port: 3142 },
  { id: 'opus', port: 3143 },
]
const BLOCKS = args.blocks

const PORT_SCHEMA = {
  type: 'object',
  properties: {
    filesWritten: { type: 'array', items: { type: 'string' } },
    typecheckClean: { type: 'boolean', description: 'true only if vue-tsc reported no errors in your files' },
    notCarriedOver: { type: 'array', items: { type: 'string' }, description: 'things in the source you could not port as written, one short line each' },
    guideGaps: { type: 'array', items: { type: 'string' }, description: 'things the guide got wrong, left out or left unclear, one short line each' },
  },
  required: ['filesWritten', 'typecheckClean', 'notCarriedOver', 'guideGaps'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    block: { type: 'string' },
    checklist: { type: 'array', items: { type: 'string' }, description: 'the behaviours you tested, taken from the original source' },
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          renders: { type: 'boolean' },
          consoleErrors: { type: 'number' },
          behavioursMatched: { type: 'number' },
          behavioursTested: { type: 'number' },
          pass: { type: 'boolean', description: 'true only if every tested behaviour matches the original, there is no visible defect and no console error' },
          defects: { type: 'array', items: { type: 'string' }, description: 'each concrete difference from the original, with the measured or observed evidence' },
          evidence: { type: 'array', items: { type: 'string' }, description: 'absolute paths of screenshots or data files that show it' },
        },
        required: ['model', 'renders', 'consoleErrors', 'behavioursMatched', 'behavioursTested', 'pass', 'defects', 'evidence'],
      },
    },
    harnessProblems: { type: 'array', items: { type: 'string' }, description: 'anything about the test setup that limits these verdicts' },
  },
  required: ['block', 'checklist', 'verdicts', 'harnessProblems'],
}

function portPrompt(block, model) {
  return `Your working folder is ${X} (relative paths in the task are relative to it; cd there first). Read prompts/${block.name}.${model.id}.md in full and carry out exactly the task it describes. That document is your only source: do not read any other file under prompts/, do not read the other vue-* folders, do not open a browser or start a server, and do not search the disk for the original project. When you are done return the structured result.`
}

function verifyPrompt(block) {
  const ports = MODELS.map((m) => `- ${m.id}: http://localhost:${m.port}/?only=${block.name} (demo root: the element with a data-demo attribute; source in ${X}/vue-${m.id}/src/components/${block.pascal}.vue)`).join('\n')
  return `You are judging three Vue ports of the SunUI block "${block.name}" against the React original. Three different models wrote the ports from the same guide. Be strict and concrete: your verdicts decide whether a port may be published as verified.

The original runs at http://localhost:3100/preview/${block.name}?l=en (demo root: the element with a data-preview-stage attribute). Its source is /Applications/Projects/nextjs/sunui-design/apps/web/registry/free/${block.name}/${block.name}.tsx and demo.tsx next to it. You may read those.

The ports (all servers are already running, do not start or stop anything):
${ports}

How to test:
1. Read the original source and write down a checklist of 8 to 14 observable behaviours: every state, what triggers it, and the numbers that matter (text shown, attributes such as aria-* and disabled, sizes, timings).
2. Write ONE Playwright script and run the same steps on the original and on each port. Put it in ${X}/verify/${block.name}.mjs and run it with node from ${CAP} (that folder has playwright-core installed). Launch Chrome like this: import { chromium } from "playwright-core"; import { findChrome } from "/Applications/Projects/nextjs/sunui-design/apps/web/scripts/find-chrome.mjs"; const f = findChrome(); const exe = typeof f === "string" ? f : f.path ?? Object.values(f)[0]; chromium.launch({ executablePath: exe, headless: true }). Use a new context per target with locale "en-US", colorScheme "light" and an init script that sets localStorage "sunui-theme" to "light". ${CAP}/cap2.mjs is a working example of this setup; read it first.
3. Use real mouse and keyboard events. Record text, attributes and bounding boxes after each step, sample positions over time where the block animates, collect console errors and page errors, and save a screenshot after each step to ${X}/verify/shots/${block.name}-<target>-<step>.png.
4. Look at the screenshots yourself (read the image files) and compare each port with the original side by side.

Rules:
- Do not edit any port or any project file. Only write under ${X}/verify/.
- Differences that do NOT count as defects: the original uses the site's blue accent and fonts while the ports use the neutral default theme; a port may show a plain grey block where the original shows a product photo; text widths may differ by a few pixels because of the font.
- Everything else that differs is a defect: a missing state, wrong text, a wrong or missing attribute, a control that does not respond, a layout that is visibly broken, an animation that snaps where the original moves or moves where the original snaps, timing that is off by more than about 25%, any console error.
- If a step fails only because your selector does not fit one port's markup, fix your script, not your verdict. Report a defect only when the behaviour itself differs.
- A port that does not render or does not compile fails; say what the error is.
- Give one verdict per model (haiku, sonnet, opus) and cite the evidence for every defect.`
}

const results = await parallel(
  BLOCKS.map((block) => async () => {
    const ports = await parallel(
      MODELS.map((model) => () =>
        agent(portPrompt(block, model), {
          label: `port ${block.name} (${model.id})`,
          phase: 'Port',
          model: model.id,
          schema: PORT_SCHEMA,
          agentType: 'general-purpose',
        }).then((r) => ({ model: model.id, result: r })),
      ),
    )
    log(`${block.name}: ${ports.filter((p) => p && p.result).length} of ${MODELS.length} ports written`)
    const verdict = await agent(verifyPrompt(block), {
      label: `judge ${block.name}`,
      phase: 'Verify',
      schema: VERDICT_SCHEMA,
      agentType: 'general-purpose',
    })
    return { block: block.name, ports, verdict }
  }),
)

return results
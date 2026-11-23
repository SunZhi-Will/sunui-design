export const meta = {
  name: 'port-guides-phase-2-rerun',
  description: 'Rerun the 28 failed Vue and Svelte ports with the corrected guides: Sonnet ports, an independent judge compares with the original, Sonnet challenges every pass',
  phases: [
    { title: 'Port', detail: 'Sonnet writes each failed port again from the corrected guide' },
    { title: 'Judge', detail: 'one judge per block runs the checklist on the original and the ports' },
    { title: 'Challenge', detail: 'Sonnet looks for checklist items the judge did not really test' },
  ],
}

const B = '/private/tmp/claude-501/-Users-sun--claude-spares-spare-pTIojw/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/p3'
const CAP = '/private/tmp/claude-501/-Users-sun--claude-spares-spare-pTIojw/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/pilot/cap'
const WEB = '/Applications/Projects/nextjs/sunui-design/apps/web'
const ALL = [
  { id: 'vue', port: 3161, file: (p) => `vue/src/components/${p}.vue`, demo: (p) => `vue/src/demos/${p}Demo.vue`, check: 'cd vue && npx vue-tsc --noEmit' },
  { id: 'svelte', port: 3162, file: (p) => `svelte/src/lib/components/${p}.svelte`, demo: (p) => `svelte/src/demos/${p}Demo.svelte`, check: 'cd svelte && npx svelte-check --tsconfig ./tsconfig.json' },
]
const BLOCKS = args
const plats = (block) => ALL.filter((p) => block.platforms.includes(p.id))

const PORT_SCHEMA = {
  type: 'object',
  properties: {
    filesWritten: { type: 'array', items: { type: 'string' } },
    checkClean: { type: 'boolean' },
    notCarriedOver: { type: 'array', items: { type: 'string' } },
    guideGaps: { type: 'array', items: { type: 'string' }, description: 'what the guide got wrong, left out or left unclear; one short line each' },
  },
  required: ['filesWritten', 'checkClean', 'notCarriedOver', 'guideGaps'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    block: { type: 'string' },
    itemsTotal: { type: 'number', description: 'checklist items that apply on the web' },
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['vue', 'svelte'] },
          renders: { type: 'boolean' },
          consoleErrors: { type: 'number' },
          itemsTested: { type: 'number' },
          itemsPassed: { type: 'number' },
          tabOrderMatches: { type: 'boolean' },
          reducedMotionChecked: { type: 'boolean' },
          pass: { type: 'boolean', description: 'true only if every tested item matches the original, the Tab order matches, there is no visible defect and no console error' },
          defects: { type: 'array', items: { type: 'string' }, description: 'checklist id, what differs, and the measured or observed evidence' },
          untestedItems: { type: 'array', items: { type: 'string' }, description: 'checklist ids you could not test, each with the reason' },
          evidence: { type: 'array', items: { type: 'string' } },
        },
        required: ['platform', 'renders', 'consoleErrors', 'itemsTested', 'itemsPassed', 'tabOrderMatches', 'reducedMotionChecked', 'pass', 'defects', 'untestedItems', 'evidence'],
      },
    },
    checklistProblems: { type: 'array', items: { type: 'string' }, description: 'checklist items that are wrong about the original, with what the original really does' },
    harnessProblems: { type: 'array', items: { type: 'string' } },
  },
  required: ['block', 'itemsTotal', 'verdicts', 'checklistProblems', 'harnessProblems'],
}

const CHALLENGE_SCHEMA = {
  type: 'object',
  properties: {
    challenges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['vue', 'svelte'] },
          upheld: { type: 'boolean', description: 'true if the pass stands' },
          notReallyTested: { type: 'array', items: { type: 'string' }, description: 'checklist ids the script did not actually exercise or compare, with why' },
          missedDefects: { type: 'array', items: { type: 'string' }, description: 'a difference visible in the judge\'s own data or in the port source that the judge did not report' },
        },
        required: ['platform', 'upheld', 'notReallyTested', 'missedDefects'],
      },
    },
  },
  required: ['challenges'],
}

function portPrompt(block, platform) {
  return `Your working folder is ${B} (relative paths in the task are relative to it; cd there first). Read prompts/${block.name}.${platform.id}.md in full and carry out exactly the task it describes. That document is your only source: do not read any other file under prompts/, do not read other components or demos in the project, do not open a browser or start a server, and do not search the disk for the original project. Other jobs are writing other components in the same project at the same time: when you run the checker (\`${platform.check}\`), only errors in your own two files count. When you are done return the structured result.`
}

function judgePrompt(block) {
  const ps = plats(block)
  const ports = ps.map((p) => `- ${p.id}: http://localhost:${p.port}/?only=${block.name} (demo root: the element with a data-demo attribute; source ${B}/${p.file(block.pascal)})`).join('\n')
  const n = ps.length === 1 ? `one port of the SunUI block "${block.name}" (a ${ps[0].id} port` : `two ports of the SunUI block "${block.name}" (a Vue port and a Svelte port, each`
  return `You are judging ${n} written by another model from a guide) against the React original. Be strict and concrete: your verdict decides whether a port may be published as verified.

Original: http://localhost:3100/preview/${block.name}?l=en (demo root: the element with a data-preview-stage attribute). Its source is ${WEB}/registry/free/${block.name}/${block.name}.tsx with demo.tsx beside it; you may read them.
Ports to judge (servers are running; do not start or stop anything). Judge only these platforms: ${ps.map((p) => p.id).join(', ')}.
${ports}

The acceptance checklist is ${WEB}/content/port-checklists/${block.name}.json. Test every item whose scope is "all" or "web". The checklist has been corrected once against measurements of the original, but if an item is still wrong about what the ORIGINAL does, the original wins; report the item under checklistProblems and judge the ports against the original's real behaviour.

How to test:
1. Write ONE Playwright script, ${B}/verify/${block.name}.mjs, and run the same steps on the original and on each port. Have it write its raw measurements to ${B}/verify/${block.name}.json. Run it with node from ${CAP}, which has playwright-core installed (if the import does not resolve from your script's folder, import it by absolute path from ${CAP}/node_modules/playwright-core/index.mjs). Launch Chrome like this: import { findChrome } from "${WEB}/scripts/find-chrome.mjs"; const f = findChrome(); const exe = typeof f === "string" ? f : f.path ?? Object.values(f)[0]; chromium.launch({ executablePath: exe, headless: true }). Use a fresh context per target with locale "en-US", colorScheme "light" and an init script that sets localStorage "sunui-theme" to "light". ${CAP}/cap2.mjs is a working example.
2. The original's demo may replay itself for recordings (an autoplay with a fake cursor). Stop it first with a real pointer press inside the demo, and confirm the demo is at rest before you start.
3. Use real mouse and keyboard events. After each step record text, attributes (aria-*, role, disabled, data-*), values and bounding boxes; where the block animates, sample positions or sizes every frame and compare the curves (start, direction of the first movement, peak, end, duration). Collect console errors and page errors. Save a screenshot per step to ${B}/verify/shots/${block.name}-<target>-<step>.png.
4. Keyboard: press Tab through the whole demo on each target and compare the sequence of focused elements. A port that stops on anything the original does not stop on (a decorative svg, path or span) fails tabOrderMatches. Also check that after a MOUSE click on a control, document.activeElement is the same kind of element as in the original (the control itself, not a child span) and that keyboard keys the block handles (Escape, Enter, arrows) still work then. Ignore Next.js dev overlay nodes in the original.
5. Reduced motion: run the main interaction once more in a context created with reducedMotion: "reduce" and check the checklist's reduced-motion items.
6. Look at the screenshots yourself (read the image files) and compare each port with the original.

Not defects: the original uses the site's blue accent and its own fonts while the ports use the neutral default theme; a port may show a plain grey block where the original shows a product photo or uses different placeholder product names; text widths may differ by a few pixels.
Defects: a missing state, wrong text, a wrong or missing attribute, a control that does not respond, a visibly broken layout, an animation that snaps where the original moves (or the reverse), an animation that first moves the wrong way, timing off by more than about 25 percent, an extra or missing Tab stop, any console error.
If a step fails only because your selector does not fit one port's markup, fix the script, not the verdict. A port that does not render fails; say why.

Do not edit any port or project file; write only under ${B}/verify/. Give one verdict per platform listed above, cite evidence for every defect, and list honestly every checklist item you could not test.`
}

function challengePrompt(block, verdict) {
  const srcs = plats(block).map((p) => `${B}/${p.file(block.pascal)}`).join(' and ')
  return `A judge compared ports of the SunUI block "${block.name}" with the original and passed at least one of them. Your job is to find out whether that pass deserves to stand. Assume the judge missed something.

Read: the checklist ${WEB}/content/port-checklists/${block.name}.json; the judge's script ${B}/verify/${block.name}.mjs and any result files it wrote next to it (${B}/verify/, names starting with ${block.name}); the port source(s) ${srcs}; and the original ${WEB}/registry/free/${block.name}/${block.name}.tsx.

For each platform the judge passed:
- notReallyTested: checklist items (scope "all" or "web") that the script does not actually exercise, or exercises without comparing the port to the original. Read the script; do not trust the judge's summary.
- missedDefects: a difference you can show from the judge's own recorded data, or from reading the port source against the original (a state that is never reached, a wrong number, a missing attribute, a handler that is absent). Quote the line or the value.
- upheld: false if you found a missed defect, or if an untested item covers a core state of the block. true otherwise.
Do not run browsers or edit anything. Only report what you can point to.

The judge's verdict:
${JSON.stringify(verdict, null, 1)}`
}

const results = await pipeline(
  BLOCKS,
  async (block) => {
    const ports = await parallel(
      plats(block).map((platform) => () =>
        agent(portPrompt(block, platform), { label: `port ${block.name} ${platform.id}`, phase: 'Port', model: 'sonnet', schema: PORT_SCHEMA, agentType: 'general-purpose' }).then((r) => ({ platform: platform.id, result: r })),
      ),
    )
    return { ports }
  },
  async (prev, block) => {
    const verdict = await agent(judgePrompt(block), { label: `judge ${block.name}`, phase: 'Judge', schema: VERDICT_SCHEMA, agentType: 'general-purpose' })
    return { ...prev, verdict }
  },
  async (prev, block) => {
    const passed = ((prev.verdict && prev.verdict.verdicts) || []).filter((v) => v.pass)
    if (!passed.length) return { block: block.name, platforms: block.platforms, ...prev, challenge: null }
    const challenge = await agent(challengePrompt(block, prev.verdict), { label: `challenge ${block.name}`, phase: 'Challenge', model: 'sonnet', schema: CHALLENGE_SCHEMA, agentType: 'general-purpose' })
    return { block: block.name, platforms: block.platforms, ...prev, challenge }
  },
)

const done = results.filter(Boolean)
log(`blocks finished: ${done.length} of ${BLOCKS.length}`)
return done